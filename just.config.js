const { task, option, argv, series, parallel, logger } = require('just-scripts')
const util = require('util')
const proc = require('child_process')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const ncp = require('ncp')
const fs = require('fs-extra')

const manifest = require('./src/manifest.json')
const name = manifest.name.replace(/[^\w\-]+/gi, '')
const version = manifest.version

const cp = util.promisify(ncp)
const rmrf = util.promisify(rimraf)
const exec = util.promisify(proc.exec)

option('mode', {
  default: 'production',
})

// TODO: format non-rescript files
task('format', async () => {
  await exec('rescript format -all')
})

task('pre-commit', async () => {
  await exec('rescript format -all')
})

task('build', async () => {
  const mode = /^dev.+?/i.test(argv().mode) ? 'development' : 'production'
  logger.info(`Build mode: ${mode}`)
  logger.info('Build phase #1: ReScript build')
  await exec('rescript build')
  logger.info('Build phase #2: Webpack bundle')
  await exec(`webpack-cli --mode=${mode}`)
  logger.info('Build phase #3: Copying to build/')
  {
    const copyOptions = {
      stopOnErr: true,
      filter(filename) {
        switch (true) {
          case /\.res$/i.test(filename):
          case /\.bs\.js$/i.test(filename):
            return false
          default:
            return true
        }
      },
    }
    await cp('src/', 'build-mv2/', copyOptions)
    await cp('src/', 'build-mv3/', copyOptions)
    await fs.remove('build-mv2/manifest-v3.json')
    await fs.move('build-mv3/manifest-v3.json', 'build-mv3/manifest.json', { overwrite: true })
  }
})

task('clean', async () => {
  await Promise.all([
    exec('rescript clean -with-deps'),
    rmrf('build-mv2/'),
    rmrf('build-mv3/'),
  ])
})

task('zip', async () => {
  const filename = `${name}-v${version}.zip`
  const filenamemv3 = `${name}-v${version} [MV3].zip`
  logger.info(`zipping into "${filename}" / "${filenamemv3}"...`)
  await mkdirp('dist/')
  await Promise.all([
    exec(`7z a -r "dist/${filename}"    build-mv2/.`),
    exec(`7z a -r "dist/${filenamemv3}" build-mv3/.`),
  ])
})

task('srczip', async () => {
  await mkdirp('dist/')
  await exec(`git archive -9 -v -o ./dist/${name}-v${version}.Source.zip HEAD`)
})


task('default', 'build')
// task('clean-build', series('clean', 'build'))
task('dist', parallel('zip', 'srczip'))
task('all', series('default', 'dist'))
