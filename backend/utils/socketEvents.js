function emitRequestStatusUpdate(io, requestType, requestDoc) {
  if (!io || !requestDoc) return;

  const payload = {
    requestType,
    requestId: requestDoc._id,
    status: requestDoc.status,
    updatedAt: new Date().toISOString(),
  };

  if (requestDoc.user) {
    io.to(`user:${requestDoc.user.toString()}`).emit(
      "request:status-updated",
      payload,
    );
  }

  if (requestType === "mechanic" && requestDoc.mechanic) {
    io.to(`mechanic:${requestDoc.mechanic.toString()}`).emit(
      "request:status-updated",
      payload,
    );
  }

  if (requestType === "fuel" && requestDoc.fuelStation) {
    io.to(`fuelStation:${requestDoc.fuelStation.toString()}`).emit(
      "request:status-updated",
      payload,
    );
  }
}

module.exports = {
  emitRequestStatusUpdate,
};
