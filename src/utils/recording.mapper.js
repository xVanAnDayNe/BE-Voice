exports.mapRecording = (row) => {
  return {
    RecordingID: row._id,
    PersonID: row.personId,
    SentenceID: row.sentenceId,
    AudioUrl: row.audioUrl,
    IsApproved: row.isApproved,
    RecordedAt: row.recordedAt,
  };
};
