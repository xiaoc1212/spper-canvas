import { CameraState } from '../types';

/**
 * Screen coordinates to World coordinates.
 * Allows translating a mouse click (which is relative to the screen/container) 
 * into the absolute coordinate inside the infinite canvas.
 */
export const screenToWorld = (screenX: number, screenY: number, camera: CameraState) => {
  return {
    x: (screenX - camera.x) / camera.scale,
    y: (screenY - camera.y) / camera.scale,
  };
};

/**
 * World coordinates to Screen coordinates.
 * Allows translating a canvas card position into where it physically renders on screen.
 */
export const worldToScreen = (worldX: number, worldY: number, camera: CameraState) => {
  return {
    x: worldX * camera.scale + camera.x,
    y: worldY * camera.scale + camera.y,
  };
};

/**
 * Zoom to Cursor
 * When zooming, we want the point under the mouse curser (screenX, screenY) to remain
 * visually static. We achieve this by calculating the world coordinate under the mouse,
 * changing the scale, re-calculating where that world coordinate WOULD be, and applying 
 * a compensatory pan (dx, dy) to keep it locked in place.
 */
export const zoomToCursor = (
  pointerX: number, 
  pointerY: number, 
  currentCamera: CameraState, 
  zoomFactor: number,
  minScale = 0.1,
  maxScale = 5.0
): CameraState => {
  const newScale = Math.max(minScale, Math.min(maxScale, currentCamera.scale * zoomFactor));
  
  if (newScale === currentCamera.scale) {
    return currentCamera;
  }

  // 1. Where is the mouse in the world before zooming?
  const worldPos = screenToWorld(pointerX, pointerY, currentCamera);

  // 2. Where would that world position be on screen after zooming (if we didn't pan)?
  // newScreenX = worldPos.x * newScale + currentCamera.x
  
  // 3. We want newScreenX to equal pointerX.
  // pointerX = worldPos.x * newScale + newCameraX
  // newCameraX = pointerX - worldPos.x * newScale
  
  const newX = pointerX - worldPos.x * newScale;
  const newY = pointerY - worldPos.y * newScale;

  return {
    x: newX,
    y: newY,
    scale: newScale,
  };
};
