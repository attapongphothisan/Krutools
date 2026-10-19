# Automatic rectification and multi-page capture

The offline pipeline finds a bright-page contour, reduces its convex hull to four corners, and applies a perspective warp. It then fits a smooth quadratic displacement supported by multiple text rows. A correction is accepted only when most reference rows have sufficient coverage, their curvature agrees, and their detrended residual improves substantially. Flat pages, blank images, colorful pictures and contradictory text curves remain unchanged. The same worker pipeline runs for preview and high-resolution export.

This is a conservative two-dimensional text-row correction, not a learned three-dimensional page reconstruction. Severe folds, multi-axis wrinkles, graphics-only curved pages, occluded text and large shadow regions may not straighten. The original File remains available; “คืนภาพเต็ม” disables both perspective cropping and text-row correction for that page.

Capture keeps full-resolution photo blobs (when ImageCapture is available) in a temporary queue. Taking another photo does not wait for document analysis. Done processes each queued file; successful pages are released from the camera queue and failed pages remain available for retry. The user can edit all imported pages afterwards. Camera and temporary scans remain local and require no server.

Sources used to select the approach (this code does not implement these complete research models):
- Revisiting Document Image Dewarping by Grid Regularization, CVPR 2022: https://openaccess.thecvf.com/content/CVPR2022/html/Jiang_Revisiting_Document_Image_Dewarping_by_Grid_Regularization_CVPR_2022_paper.html
- UVDoc, SIGGRAPH Asia 2023: https://arxiv.org/abs/2302.02887
- DewarpNet reference implementation: https://github.com/cvlab-stonybrook/DewarpNet

Validation: synthetic shared-curvature reduction, rejection of contradictory curves, preservation of flat/blank/colorful images, rotated-boundary detection, and existing crop/color/export regressions. Actual camera quality and difficult real bent-page photographs still need device testing.
