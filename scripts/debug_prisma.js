const { startTestDb, stopTestDb } = require('./server/__tests__/utils/testDbManager');

async function testIt() {
    try {
        await startTestDb();
        console.log("Success");
    } catch(err) {
        console.error("DIAGNOSE ERR:", err);
    } finally {
        await stopTestDb();
    }
}

testIt();
