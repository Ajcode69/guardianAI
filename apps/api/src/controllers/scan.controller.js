const { analyzeLinkService } = require('../services/scan.service.js');
const { CODES, CODE_META } = require('../utils/codes');

/**
 * handleScanController — handles piracy scan requests.
 */
const handleScanController = async (req, res) => {
  try {
    const result = await analyzeLinkService(req.body);
    const { httpStatus, publicMessage } = CODE_META[result.code] || CODE_META[CODES.INTERNAL_ERROR];

    return res.status(httpStatus).json({
      success: result.ok,
      message: publicMessage.replace("{{field}}", "link").replace("{{resource}}", "Scan report"),
      data: result.data,
    });
  } catch (err) {
    console.error("[ScanController] Unhandled:", err);

    const { httpStatus, publicMessage } = CODE_META[CODES.INTERNAL_ERROR];
    return res.status(httpStatus).json({
      success: false,
      message: publicMessage,
      data: [],
    });
  }
};

module.exports = { handleScanController };
