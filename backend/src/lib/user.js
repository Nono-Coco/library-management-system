function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    role: user.role,
    createdAt: user.createdAt,
  };
}

module.exports = {
  toPublicUser,
};
