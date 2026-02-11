/**
 * Web App Apps Script para receber payload JSON e:
 * - manter compatibilidade com envio de lead
 * - salvar PDF em pasta específica do Drive quando receber contentBase64
 *
 * Deploy:
 * 1) Extensions > Apps Script
 * 2) Deploy > New deployment > Web app
 * 3) Execute as: Me
 * 4) Who has access: Anyone (ou Anyone with link)
 */

function doOptions() {
  return cors_(ContentService.createTextOutput(""));
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);

    if (isReportUpload_(payload)) {
      const result = handleReportUpload_(payload);
      return json_(result);
    }

    // Compatibilidade: payload de lead/quiz (sem PDF)
    // Aqui você pode manter sua lógica atual de planilha/log.
    return json_({
      ok: true,
      type: "lead",
      message: "Lead recebido com sucesso",
      receivedAt: new Date().toISOString(),
    });
  } catch (error) {
    return json_({
      ok: false,
      error: String(error && error.message ? error.message : error),
      stack: String(error && error.stack ? error.stack : ""),
    });
  }
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Body vazio no POST");
  }

  const raw = e.postData.contents;
  try {
    return JSON.parse(raw);
  } catch (parseError) {
    throw new Error("JSON inválido no body");
  }
}

function isReportUpload_(payload) {
  return Boolean(
    payload &&
      payload.contentBase64 &&
      payload.mimeType === "application/pdf" &&
      payload.fileName
  );
}

function handleReportUpload_(payload) {
  const folderId = payload.folderId;
  const fileName = sanitizeFileName_(payload.fileName || "Relatorio-Perfil.pdf");
  const contentBase64 = payload.contentBase64;

  if (!folderId) {
    throw new Error("folderId é obrigatório para upload do relatório");
  }

  const folder = DriveApp.getFolderById(folderId);
  const bytes = Utilities.base64Decode(contentBase64);
  const blob = Utilities.newBlob(bytes, "application/pdf", fileName);
  const file = folder.createFile(blob);

  // Opcional: compartilhar por link (somente leitura)
  // file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return {
    ok: true,
    type: "report",
    fileId: file.getId(),
    fileName: file.getName(),
    folderId: folderId,
    url: file.getUrl(),
    webViewLink: file.getUrl(),
    createdAt: new Date().toISOString(),
  };
}

function sanitizeFileName_(name) {
  return String(name)
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function json_(obj) {
  const output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return cors_(output);
}

function cors_(output) {
  // Apps Script ContentService tem limitação de headers customizados em alguns contextos,
  // mas mantendo função para cenários onde esteja disponível.
  try {
    output.setHeader("Access-Control-Allow-Origin", "*");
    output.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    output.setHeader("Access-Control-Allow-Headers", "Content-Type");
  } catch (e) {
    // ignora silenciosamente quando setHeader não estiver disponível
  }
  return output;
}
