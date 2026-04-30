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
    if (body.country) console.log(`[ScanService] Jurisdiction: ${body.country}`);

    const result = await guardianAgent.invoke({
      link: body.link,
      country: body.country || '',
      contentHints: body.contentHints || {},
    });

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

    // Collect non-fatal warnings from the analysis
    const warnings = [];

    if (report.matching?.audio?.hasMatch === false && body.link) {
      // Only warn if we expected audio matching (video content)
      if (report.asset?.contentType === 'video' && !report.matching?.audio?.summary?.includes('performed')) {
        warnings.push(CODE_META[CODES.AUDIO_MATCH_FAILED].publicMessage);
      }
    }

    if (report.jurisdictionAnalysis?.skipped) {
      warnings.push(CODE_META[CODES.LEGAL_ANALYSIS_UNAVAILABLE].publicMessage);
    }

    console.log(`[ScanService] Done — pirated: ${report?.copyrightAssessment?.isPirated}`);

    const { internalMessage } = CODE_META[CODES.SUCCESS];
    return {
      ok: true,
      code: CODES.SUCCESS,
      message: internalMessage.replace("{{resource}}", "Scan report"),
      data: report,
      ...(warnings.length > 0 && { warnings }),
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
