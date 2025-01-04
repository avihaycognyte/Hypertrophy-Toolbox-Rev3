# Core imports
from .config import DB_FILE
from .database import DatabaseHandler
from .db_initializer import initialize_database

# Data handling and business logic
from .data_handler import DataHandler
from .business_logic import BusinessLogic

# Exercise management
from .exercise_manager import (
    get_exercises,
    add_exercise,
    delete_exercise,
    fetch_unique_values
)

# Summary calculations
from .weekly_summary import (
    calculate_weekly_summary,
    get_weekly_summary,
    calculate_total_sets,
    calculate_exercise_categories,
    calculate_isolated_muscles_stats
)
from .session_summary import calculate_session_summary

# Volume and classification utilities
from .volume_classifier import (
    get_volume_class,
    get_volume_label,
    get_volume_tooltip,
    get_category_tooltip,
    get_subcategory_tooltip
)

# Workout log functionality
from .workout_log import (
    get_workout_logs,
    check_progression
)

# User selection handling
from .user_selection import get_user_selection

# Define public interface
__all__ = [
    # Core
    "DB_FILE",
    "DatabaseHandler",
    "initialize_database",
    
    # Data handling
    "DataHandler",
    "BusinessLogic",
    
    # Exercise management
    "get_exercises",
    "add_exercise",
    "delete_exercise",
    "fetch_unique_values",
    
    # Summary calculations
    "calculate_weekly_summary",
    "get_weekly_summary",
    "calculate_total_sets",
    "calculate_session_summary",
    "calculate_exercise_categories",
    "calculate_isolated_muscles_stats",
    
    # Volume and classification
    "get_volume_class",
    "get_volume_label",
    "get_volume_tooltip",
    "get_category_tooltip",
    "get_subcategory_tooltip",
    
    # Workout log
    "get_workout_logs",
    "check_progression",
    
    # User selection
    "get_user_selection"
]

# Remove duplicate function definition
def get_workout_logs():
    """
    This function is now imported from workout_log.py
    Keeping this here for backward compatibility
    """
    from .workout_log import get_workout_logs as get_logs
    return get_logs()
