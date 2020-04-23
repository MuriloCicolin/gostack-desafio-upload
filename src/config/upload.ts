import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { resolve } from 'path';

const tempFolder = resolve(__dirname, '..', '..', 'tmp');

export default {
  directory: tempFolder,
  storage: diskStorage({
    destination: tempFolder,
    filename(req, file, callback) {
      const fileHash = randomBytes(10).toString('HEX');
      const fileName = `${fileHash}-${file.originalname}`;

      return callback(null, fileName);
    },
  }),
};
