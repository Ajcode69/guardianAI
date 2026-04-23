const { analyzeLinkService } = require('../services/scan.service.js');
const { CODES, getInterpolatedMeta } = require('../utils/codes');

/**
 * handleScanController — handles piracy scan requests.
 * Reads the service result and builds the HTTP response inline.
 */
const handleScanController = async (req, res) => {
  try {
    const result = await analyzeLinkService(req.body);
    const meta = getInterpolatedMeta(result.code, result._replacements || {});

    return res.status(meta.httpStatus).json({
      success: result.ok,
      message: meta.publicMessage,
      data: result.data,
    });
  } catch (err) {
    console.error("[ScanController] Unhandled:", err);

    const meta = getInterpolatedMeta(CODES.INTERNAL_ERROR);
    return res.status(meta.httpStatus).json({
      success: false,
      message: meta.publicMessage,
      data: [],
    });
  }
};

module.exports = { handleScanController };
