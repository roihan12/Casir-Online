

const createAuditLog = async (
  tx,
  { userId, userName, ipAddress, cabangId, action, tableName, recordId, oldValues, newValues }
) => {
  return tx.auditLog.create({
    data: {
      user_id: userId,
      created_by: userName,
      ip_address: ipAddress,
      action,
      cabang_id: cabangId,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues ? JSON.stringify(oldValues) : null,
      new_values: newValues ? JSON.stringify(newValues) : null,
    },
  });
};

module.exports = { createAuditLog };