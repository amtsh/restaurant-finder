function initializeServices() {
  placeServiceMgr.init(mapManager.getMap());
  drawingManager.init();
}

function startDrawing() {
  drawingManager.enableDrawing(mapManager.getMap());
}

function stopDrawing() {
  drawingManager.disableDrawing();
}
