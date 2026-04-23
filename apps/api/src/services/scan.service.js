const { guardianAgent } = require('@guardian/agent');
const { CODES, getInterpolatedMeta, isSuccessCode } = require('../utils/codes');

/**
 * analyzeLinkService — orchestrates piracy scanning for a given link.
 * Returns { ok, code, message, data, _replacements }.
 */
const analyzeLinkService = async (body) => {
  if (!body.link) {
    const r = { field: "link" };
    const meta = getInterpolatedMeta(CODES.LINK_REQUIRED, r);
    return { ok: false, code: CODES.LINK_REQUIRED, message: meta.internalMessage, data: [], _replacements: r };
  }

  try {
    console.log(`[ScanService] Analyzing: ${body.link}`);
    const result = await guardianAgent.invoke({ link: body.link });
    const report = result.report;

    if (!report) {
      const meta = getInterpolatedMeta(CODES.REPORT_EMPTY);
      return { ok: false, code: CODES.REPORT_EMPTY, message: meta.internalMessage, data: [] };
    }

    console.log(`[ScanService] Done — pirated: ${report?.piracy?.isPirated}`);

    const r = { resource: "Scan report" };
    const meta = getInterpolatedMeta(CODES.SUCCESS, r);
    return { ok: true, code: CODES.SUCCESS, message: meta.internalMessage, data: report, _replacements: r };
  } catch (err) {
    console.error("[ScanService] Error:", err);

    const meta = getInterpolatedMeta(CODES.SCAN_FAILED);
    return { ok: false, code: CODES.SCAN_FAILED, message: meta.internalMessage, data: [] };
  }
};

module.exports = { analyzeLinkService };
