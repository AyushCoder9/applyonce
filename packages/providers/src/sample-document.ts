/** Hand-rolled minimal single-page PDF — no library, just enough for a demo "attach from ApplyOnce" preview. */
export function tinyPdf(title: string, subtitle = "SAMPLE ONLY - NOT AN ISSUER DOCUMENT"): Buffer {
  const esc = (s: string) => s.replace(/([()\\])/g, "\\$1");
  const line1 = esc(title).slice(0, 70);
  const line2 = esc(subtitle).slice(0, 70);

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] = "<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 420 220] /Contents 5 0 R >>";
  objects[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  const stream = `BT /F1 16 Tf 24 160 Td (${line1}) Tj 0 -28 Td /F1 11 Tf (${line2}) Tj ET`;
  objects[5] = `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`;

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (let i = 1; i <= 5; i++) {
    offsets[i] = Buffer.byteLength(body, "latin1");
    body += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(body, "latin1");
  body += "xref\n0 6\n0000000000 65535 f \n";
  for (let i = 1; i <= 5; i++) body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(body, "latin1");
}

const PHOTO = "iVBORw0KGgoAAAANSUhEUgAAAPAAAAC0CAIAAAAl/ja/AAAAN3RFWHREZXNjcmlwdGlvbgBTWU5USEVUSUMgU0FNUExFIC0gTk9UIEFOIElERU5USVRZIERPQ1VNRU5UR37LzwAAA/pJREFUeJzt2sGtHDcURFHFo4i8dQAKw9EqAhleeGMYMOCeaXK6f7GLBzgBPKDujvz288d3qPEtfgFcSNBUETRVBE0VQVNF0FQRNFUETRVBU0XQVBE0Vb79+vMvqCFoqgiaKoKmiqCpImiqCJoqgqaKoKkiaKoImiqCpoqgqSJoqgiaKoKmiqCpImiqCJoqgqaKoKkiaKoImiqCpoqgqSJoqgiaKoKmiqCpImiqCJoqgqaKoK/32+9/nBe/toygLzPUsbJvIugLfJiyrC8k6I9cmLKsLyHoeTfVrOlPCHrSrTVrepqgh31ByrKeJugxX1yzpkcJekCkZk0PEfQAQa9P0GcFa9b0eYI+JV6zpk8S9HvxjjV9nqDfi0cs6PME/Ua8YE0PEfQb8XwFPUTQr8Tb1fQoQb8SD1fQowT9SjxcQY8S9KF4tZqeIOhD8WQFPUHQh+LJCnqCoA/FkxX0BEEfiicr6AmCPhRPVtATBH0onqygJwj6UDxZQU8Q9KF4soKeIOhD8WQFPUHQh+LJCnqCoA/FkxX0BEEfiicr6AmCPhRPVtATBH0onqygJwj6lXi1ah4l6Ffi4Qp6lKBfiYcr6FGCfiPerpqHCPqNeL6CHiLo9+IFq/k8Qb8Xj1jQ5wn6lHjHaj5J0Gep+REEPUDN6xP0AEGvT9Bj1Lw4QQ9T88oEPUnKaxL0PDUvSNAfUfNqBH0BKa9D0JeR8goEfT0dBwmaKoKmiqCpImiqCJoqgqaKoKkiaKoI+gKevtch6Ek3fUsS94cEPeALIhb3hwT9XrBjZY8S9KF4u8qeIOj/EY9V1tME/R/xQGX9IUH/Ix6lrC8h6IaUZf2vrYOOxyfry20adDw4Wd9kx6DjnWn6PtsFHS9M07faKOh4WLL+ArsEHe9pBfEVvsAWQcdLWkd8i7v1Bx1vaDXxRW7VHHQ8nZXF17lJbdDxYtYX3+gOnUHHW3mK+FKXE/TW4ktdrjDoeCXPEt/rWm1Bx/t4ovhqF6oKOl7Gc8W3u0pP0PEmni6+4CVKgo7X0CG+4+cEjaAXE++gSXzNDz0+6HgBfeKbChpBVwQd375VfFlBI+iHBx1fvVt8X0Ej6McGHd97B/GVBY2g0xeoeWXxrQWNoJ8mPvM+4lv3Bx3feDfxxQWNoJ8jPvBu4os3Bx1fd0/x3QWNoJ8gPu2e4rsLGkEvL77rzuLrCxpBry0+6s7i6wsaQa8tPurO4usLGkGvLT7qzuLrCxpBry0+6s7i6wsaQa8tPurO4usLGkGvLT7qzuLrCxpBry0+6s7i6wsaQa8tPurO4uufDfrnj+9QQ9BUETRVBE0VQVNF0FQRNFUETRVBU0XQVBE0VQRNlb8BvkGSGcSP7jcAAAAASUVORK5CYII=";
const SIGNATURE = "iVBORw0KGgoAAAANSUhEUgAAAPAAAAC0CAIAAAAl/ja/AAAAN3RFWHREZXNjcmlwdGlvbgBTWU5USEVUSUMgU0FNUExFIC0gTk9UIEFOIElERU5USVRZIERPQ1VNRU5UR37LzwAABFZJREFUeJzt211uE0EQhdGsJ9vgla1EYt+sIIgHkJCQseN2T3D/1J0jnSfT8tSUP4hi7Jfvb68Q42X5BPBEgiaKoIkiaKIImiiCJoqgiSJoogiaKIImiqCJ8vL+4yfEEDRRBE0UQRNF0EQRNFEETRRBE0XQRBE0UQRNFEETRdBEETRRBE0UQRNF0EQRNFEETRRBE0XQRBE0UQRNFEETRdBEETRRBE0UQRNF0EQRNFEETRRBE0XQRBE0UQRNFEETRdBEETRRBE0UQRNF0EQRNFEETRRBE0XQRBE0UQRNFEETRdBEETRRBE0UQRNF0EQRNFEETZRJQX/5+u23cedXjVplzuWjTrvWjKD/rLJ/oYcODxp10PlVoy6fc9rltgv68vD8F+DTo+485w6jTrvc7KAf3tvCoP9nzkKjLplz2hWHB315Pw/v7er+l2z/0KidhxfOuc+oc8wIuv8Or/50/vb7L3076sw5+0fdZ6VzbBf0qo3cDtYY9dDh5Su9Pb9qpRPMDrpxnx8+vqqS9utxb/7dRt1tpROMDbp/y0cPLxz10PzLV7rbqKMtCPrDRR/953DOqFWCLrTS0bYI+urNjfl7edYvVQtH3TDoJdYE/X4RcbvmOds/NGehUfecc6hlH07q3/6cYfpH/fTzWOkEKz9t17/60dupEnTPokqsdJwtgt52O58YdfQYnXMKemtDt/PcJ68y6vK/nIMIWtBbz3lUjaCHKhR0FYJeuaMqQT/9mQuN2k/QZQi6h6DLKBT0QmcPesTTVhm1ypyHlAl6kEJBVyHotO0XCjrv9isFXWX7VZ6z1qidzh50FYWCXuvUQRd630rQnQR99lHD5qwUdKHtL39d81baqVjQ5/xv6kIfJBJ0sX3l3bWgV6ry+clt77r0HnoEBl3lKxubfGGn0Ep7FAu6f/XLt//Er0tZab96QTe29uXfb7O297s26H3mrDXqQ+cNeqs524eN2i8n6Nt1N7Y/Z/XtUXvmnDPqw6D3WelDaUG3H5m8/SqjVpmzR72g7+3u3oP9h6fNefv42jlrjdoWEnRjy/2HJ8x578HGqLut9Oh9TZYTdOPw7c/NVaO2KykU9MKVtlUN+tAvVSWCPnpfp11pW8mgLzf48L2kqxdgZiVHL311L5Mr+XvpzVfaVjjoS088PHTOQqM+976mOUXQV+cXjvr0+zrnShuqBv3e95Nxh+0fvfTCSqqstKF80OPOn3bUEnPeUzhouCVoogiaKIImiqCJImiiCJoogiaKoIkiaKIImiiCJoqgiSJoogiaKIImiqCJImiiCJoogiaKoIkiaKIImiiCJoqgiSJoogiaKIImiqCJImiiCJoogiaKoIkiaKIImiiCJoqgiSJoogiaKIImiqCJImiiCJoogiaKoIkiaKIImiiCJoqgiSJoogiaKIImiqCJImiivHx/e4UYgiaKoIkiaKIImiiCJoqgiSJoogiaKIImiqCJImii/AIDPs0IBlYzKQAAAABJRU5ErkJggg==";
export function sampleDocument(docType: string, title: string) {
  if (docType === "photo" || docType === "signature") return {mime:"image/png",bytes:Buffer.from(docType === "photo" ? PHOTO : SIGNATURE,"base64")};
  return {mime:"application/pdf",bytes:tinyPdf(title,"SAMPLE ONLY - NOT AN ISSUER DOCUMENT")};
}
