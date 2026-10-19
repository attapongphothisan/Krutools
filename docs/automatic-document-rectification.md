# Automatic rectification and multi-page capture

The offline pipeline finds a bright-page contour, reduces its convex hull to four corners, and applies a perspective warp. It then fits a smooth quadratic displacement supported by multiple text rows. A correction is accepted only when most reference rows have sufficient coverage, their curvature agrees, and their detrended residual improves substantially. Flat pages, blank images, colorful pictures and contradictory text curves remain unchanged. The same worker pipeline runs for preview and high-resolution export.

This is a conservative two-dimensional text-row correction, not a learned three-dimensional page reconstruction. Severe folds, multi-axis wrinkles, graphics-only curved pages, occluded text and large shadow regions may not straighten. The original File remains available; “คืนภาพเต็ม” disables both perspective cropping and text-row correction for that page.

Capture now uses the system camera via a synchronous click on an image file input with capture="environment". The inline web-camera queue was removed at the user's request. A website cannot force a system camera to remain open for multiple still photographs: this is controlled by the browser/OS camera UI. For many pages, the user can photograph them in their camera app and import all images through the multiple-file picker. No automatic reopening is attempted because user activation is required and reopening would prevent review/cancellation.

Boundary detection now combines a multi-threshold bright-region contour with gradient-directed Hough lines. Every proposed quadrilateral is scored for side continuity, gradient alignment and sustained inside/outside contrast at multiple distances. Candidates are refined by weighted line fitting. These checks are designed to reduce shadow-fragment cropping and confusion with interior printed tables. Synthetic tests do not establish an accuracy rate for arbitrary real-world photographs.

The three filters are original (no color changes), color scan (local illumination normalization preserving RGB channels), and black-and-white scan (adaptive thresholding). HTML Media Capture limitations: https://www.w3.org/TR/html-media-capture/


Sources used to select the approach (this code does not implement these complete research models):
- Revisiting Document Image Dewarping by Grid Regularization, CVPR 2022: https://openaccess.thecvf.com/content/CVPR2022/html/Jiang_Revisiting_Document_Image_Dewarping_by_Grid_Regularization_CVPR_2022_paper.html
- UVDoc, SIGGRAPH Asia 2023: https://arxiv.org/abs/2302.02887
- DewarpNet reference implementation: https://github.com/cvlab-stonybrook/DewarpNet

Validation: synthetic shared-curvature reduction, rejection of contradictory curves, preservation of flat/blank/colorful images, rotated-boundary detection, and existing crop/color/export regressions. Actual camera quality and difficult real bent-page photographs still need device testing.
