// storage-adapter-import-placeholder
import { postgresAdapter } from '@payloadcms/db-postgres'
import sharp from 'sharp' // sharp-import
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import { Categories } from './collections/Categories'
import { Comments } from './collections/Comments'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { s3Storage } from '@payloadcms/storage-s3'   // ← added

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        { label: 'Mobile', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Desktop', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  collections: [Pages, Posts, Media, Categories, Users, Comments],
  cors: [getServerSideURL()].filter(Boolean),
                           globals: [Header, Footer],
                           plugins: [
                             ...plugins,

                             // Safe Cloudflare R2 – only loads when variables exist (prevents build crashes)
                             ...(process.env.R2_BUCKET &&
                             process.env.R2_ACCESS_KEY_ID &&
                             process.env.R2_SECRET_ACCESS_KEY &&
                             process.env.R2_ENDPOINT
                             ? [
                               s3Storage({
                                 collections: {
                                   media: true,
                                 },
                                 bucket: process.env.R2_BUCKET,
                                 config: {
                                   endpoint: `https://${process.env.R2_ENDPOINT}`,
                                   credentials: {
                                     accessKeyId: process.env.R2_ACCESS_KEY_ID,
                                     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
                                   },
                                   region: 'auto',
                                   forcePathStyle: true,
                                 },
                                 publicUrl: process.env.R2_PUBLIC_URL,   // nice pub-xxx.r2.dev URL
                               }),
                             ]
                             : []),
                           ],
                           endpoints: [
                             {
                               path: '/health',
                               method: 'get',
                               handler: async (req) => {
                                 return new Response('OK', { status: 200 });
                               }
                             }
                           ],
                           secret: process.env.PAYLOAD_SECRET,
                           sharp,
                           typescript: {
                             outputFile: path.resolve(dirname, 'payload-types.ts'),
                           },
})
