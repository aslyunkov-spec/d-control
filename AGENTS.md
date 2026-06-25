# Windows editing rules

This project is developed on Windows.

Never use apply_patch.

When editing files:

1. Use Python scripts to modify files.
2. If the change is large, rewrite the entire file.
3. Use PowerShell or Python instead of apply_patch.
4. Never call apply_patch because Windows sandbox frequently fails.

If apply_patch fails once, do not retry.
Switch immediately to Python or PowerShell editing.