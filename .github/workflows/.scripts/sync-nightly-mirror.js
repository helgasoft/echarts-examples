const SYNC_URL = 'https://registry-direct.npmmirror.com/echarts-nightly/sync';

let timer;

async function getSyncLog(id) {
  const data = await (await fetch(SYNC_URL + '/log/' + id)).json();
  if (!data.ok) {
    return;
  }

  const log = data.log || '';
  console.log('Sync log:', log);
  if (log.includes('Fail: [')) {
    const failInfo = log.match(/Fail: \[ (.*?) \]/);
    if (failInfo && failInfo[1]) {
      throw new Error('Sync failed!');
    }
  }
  if (data.syncDone) {
    clearInterval(timer);
    console.log('Sync successfully!');
    try {
      const fullLog = await (await fetch(data.logUrl)).text();
      console.log('Sync full log:\n', fullLog);
    } catch {}
  }
}

async function sync(retryCount = 0) {
  console.log(`Start to sync nightly mirror...`);
  try {
    const data = await (
      await fetch(SYNC_URL, {
        method: 'PUT',
        query: {
          sync_upstream: true
        }
      })
    ).json();
    console.log('Sync request data', data);
    if (!data.ok) {
      throw new Error('Sync request error!');
    }
    timer = setInterval(() => getSyncLog(data.logId), 2e3);
  } catch (e) {
    console.error('failed to sync nightly mirror', e);
    if (!retryCount) {
      throw e;
    }
    console.log('Retry to sync nightly mirror...', retryCount);
    sync(--retryCount);
  }
}

sync(3);
