-- Cairn — e-invoice files: besides the PDF copy, allow the FatturaPA XML and the signed .xml.p7m in the attachments bucket.
update storage.buckets set allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp','image/heic','text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/xml','text/xml','application/pkcs7-mime']
where id = 'attachments';
