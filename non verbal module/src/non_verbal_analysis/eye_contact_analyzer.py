"""
Eye contact analysis with strict blink exclusion.
Isolates eye contact logic to ensure blink frames are completely excluded.
"""
import numpy as np
from typing import List, Any
from .pipeline import PipelineResult, PipelineContext
from .utils import calculate_ear
from .validators import is_blink_frame


# MediaPipe Face Mesh landmark indices for eyes
# Left eye: 362, 385, 387, 263, 373, 380
# Right eye: 33, 160, 158, 133, 153, 144
LEFT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
RIGHT_EYE_INDICES = [33, 160, 158, 133, 153, 144]

# Iris landmarks for gaze estimation
LEFT_IRIS_INDEX = 468
RIGHT_IRIS_INDEX = 473

# Eye corner landmarks for gaze ratio calculation
LEFT_EYE_INNER_CORNER = 362
LEFT_EYE_OUTER_CORNER = 263
RIGHT_EYE_OUTER_CORNER = 33
RIGHT_EYE_INNER_CORNER = 133


def analyze_eye_contact(context: PipelineContext, blink_threshold: float = 0.2) -> PipelineResult:
    """
    Stage 6: Analyze eye contact with strict blink exclusion.
    
    CRITICAL RULES:
    1. Blink frames are COMPLETELY EXCLUDED from all counters
    2. Gaze estimation uses normalized iris positions
    3. No assumptions about previous frames
    
    Args:
        context: Pipeline context with landmarks and face_width
        blink_threshold: EAR threshold for blink detection
        
    Returns:
        PipelineResult with eye contact analysis or skip signal
    """
    if context.landmarks is None:
        return PipelineResult.error_result("Landmarks not available for eye contact analysis")
    
    if context.face_width is None:
        return PipelineResult.error_result("Face width not available for normalization")
    
    landmarks = context.landmarks
    
    # Step 1: Extract eye landmarks
    try:
        left_eye = [landmarks[i] for i in LEFT_EYE_INDICES]
        right_eye = [landmarks[i] for i in RIGHT_EYE_INDICES]
    except IndexError as e:
        return PipelineResult.error_result(f"Invalid eye landmark indices: {str(e)}")
    
    # Step 2: Calculate Eye Aspect Ratio (EAR)
    try:
        left_ear = calculate_ear(left_eye)
        right_ear = calculate_ear(right_eye)
        avg_ear = (left_ear + right_ear) / 2.0
    except Exception as e:
        return PipelineResult.error_result(f"Failed to calculate EAR: {str(e)}")
    
    # Step 3: HARD RULE - Skip if blinking
    if is_blink_frame(avg_ear, blink_threshold):
        # DO NOT update any counters
        # DO NOT penalize the user
        # COMPLETELY SKIP this frame
        return PipelineResult.skip_frame_result("blink_detected")
    
    # Step 4: Estimate gaze (normalized by face width)
    try:
        gaze_detected = _estimate_gaze_normalized(landmarks, context.face_width)
    except Exception as e:
        return PipelineResult.error_result(f"Failed to estimate gaze: {str(e)}")
    
    # Step 5: Update counters ONLY if not blinking
    if gaze_detected:
        context.session_state.eye_contact_frames += 1
    
    context.session_state.total_processed_frames += 1
    context.eye_contact_detected = gaze_detected
    
    return PipelineResult.success_result({
        "gaze_detected": gaze_detected,
        "ear": avg_ear
    })


def _estimate_gaze_normalized(landmarks: Any, face_width: float) -> bool:
    """
    Estimate if user is looking at camera using normalized iris positions.
    
    Per spec 8.1: Gaze vector is estimated and compared to camera direction.
    This uses iris position relative to eye corners to determine if looking at camera.
    
    Args:
        landmarks: MediaPipe face landmarks
        face_width: Face width for normalization
        
    Returns:
        True if gaze is toward camera, False otherwise
    """
    def get_gaze_ratio(iris_idx: int, inner_corner_idx: int, outer_corner_idx: int) -> float:
        """Calculate normalized gaze ratio for one eye (horizontal)."""
        iris = landmarks[iris_idx]
        inner = landmarks[inner_corner_idx]
        outer = landmarks[outer_corner_idx]
        
        # Distance from iris to corners (normalized by face width)
        d_inner = np.sqrt((iris.x - inner.x)**2 + (iris.y - inner.y)**2) / face_width
        d_outer = np.sqrt((iris.x - outer.x)**2 + (iris.y - outer.y)**2) / face_width
        
        if d_outer == 0:
            return 1.0  # Assume centered
        
        return d_inner / d_outer
    
    def get_vertical_gaze(iris_idx: int, upper_lid_idx: int, lower_lid_idx: int) -> float:
        """Calculate vertical gaze position (0 = looking down, 1 = looking up)."""
        iris = landmarks[iris_idx]
        upper = landmarks[upper_lid_idx]
        lower = landmarks[lower_lid_idx]
        
        eye_height = abs(upper.y - lower.y)
        if eye_height == 0:
            return 0.5
        
        # Position of iris relative to eye center
        eye_center_y = (upper.y + lower.y) / 2
        iris_relative = (iris.y - eye_center_y) / eye_height
        
        return 0.5 - iris_relative  # Normalize so 0.5 = centered
    
    # Calculate horizontal gaze ratio for both eyes
    # Centered iris = ratio close to 1.0
    ratio_left = get_gaze_ratio(LEFT_IRIS_INDEX, LEFT_EYE_INNER_CORNER, LEFT_EYE_OUTER_CORNER)
    ratio_right = get_gaze_ratio(RIGHT_IRIS_INDEX, RIGHT_EYE_INNER_CORNER, RIGHT_EYE_OUTER_CORNER)
    
    # Calculate vertical gaze for both eyes
    # Upper/lower lid indices: left eye (386, 374), right eye (159, 145)
    vert_left = get_vertical_gaze(LEFT_IRIS_INDEX, 386, 374)
    vert_right = get_vertical_gaze(RIGHT_IRIS_INDEX, 159, 145)
    
    # RELAXED THRESHOLDS - centered = looking at camera
    # Horizontal: ratio should be close to 1.0 (0.6 to 1.6)
    # Vertical: should be close to 0.5 (0.2 to 0.8)
    horizontal_ok = 0.6 < ratio_left < 1.6 and 0.6 < ratio_right < 1.6
    vertical_ok = 0.2 < vert_left < 0.8 and 0.2 < vert_right < 0.8
    
    return horizontal_ok and vertical_ok


def get_eye_contact_score(session_state: Any) -> float:
    """
    Calculate eye contact score from session state.
    
    Args:
        session_state: Session state with counters
        
    Returns:
        Eye contact percentage (0-100)
    """
    if session_state.total_processed_frames == 0:
        return 0.0
    
    return (session_state.eye_contact_frames / session_state.total_processed_frames) * 100.0
