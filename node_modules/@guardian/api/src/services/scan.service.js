const { guardianAgent } = require('@guardian/agent');
const { CODES, CODE_META } = require('../utils/codes');

/**
 * analyzeLinkService — orchestrates piracy scanning for a given link.
 */
const analyzeLinkService = async (body) => {
  if (!body.link) {
    const { internalMessage } = CODE_META[CODES.LINK_REQUIRED];
    return {
      ok: false,
      code: CODES.LINK_REQUIRED,
      message: internalMessage.replace("{{field}}", "link"),
      data: [],
    };
  }

  try {
    console.log(`[ScanService] Analyzing: ${body.link}`);
    const result = await guardianAgent.invoke({ link: body.link });
    const report = result.report;

    if (!report) {
      const { internalMessage } = CODE_META[CODES.REPORT_EMPTY];
      return {
        ok: false,
        code: CODES.REPORT_EMPTY,
        message: internalMessage,
        data: [],
      };
    }

    console.log(`[ScanService] Done — pirated: ${report?.piracy?.isPirated}`);

    const { internalMessage } = CODE_META[CODES.SUCCESS];
    return {
      ok: true,
      code: CODES.SUCCESS,
      message: internalMessage.replace("{{resource}}", "Scan report"),
      data: report,
    };
  } catch (err) {
    console.error("[ScanService] Error:", err);

    const { internalMessage } = CODE_META[CODES.SCAN_FAILED];
    return {
      ok: false,
      code: CODES.SCAN_FAILED,
      message: internalMessage,
      data: [],
    };
  }
};

module.exports = { analyzeLinkService };
