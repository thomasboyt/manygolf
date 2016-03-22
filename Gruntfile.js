module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    secret: grunt.file.readJSON('secret.json'),

    clean: {
      build: ['build/']
    },

    webpack: {
      production: require('./webpack/production')
    },

    sftp: {
      options: {
        path: '<%= secret.path %>',
        host: '<%= secret.host %>',
        username: '<%= secret.username %>',
        agent: process.env.SSH_AUTH_SOCK,
        showProgress: true,
        srcBasePath: 'build/',
        createDirectories: true
      },

      code: {
        files: {
          './': ['build/**', '!build/assets/**']
        }
      },

      assets: {
        files: {
          './': ['build/assets/**']
        }
      }
    },

    copy: {
      index: {
        src: 'index.html',
        dest: 'build/index.html'
      }
    },

    zip: {
      itch: {
        cwd: 'build/',
        src: ['build/**/*'],
        dest: 'build/itch' + Date.now() + '.zip'
      }
    }
  });

  grunt.registerTask('dist', ['clean:build', 'webpack:production', 'copy:index']);

  grunt.registerTask('deploy:code', ['dist', 'sftp:code']);
  grunt.registerTask('deploy', ['dist', 'sftp']);

  grunt.registerTask('itch', ['dist', 'zip']);
};
