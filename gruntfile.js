module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*\n* package: <%= pkg.name %>\n* version: <%= pkg.version %>\n* built: <%= grunt.template.today("yyyy-mm-dd") %>\n*/\n'
      },
      build: {
        src: 'dist/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    cssmin: {
      options: {
        banner: '/*\n* package: <%= pkg.name %>\n* version: <%= pkg.version %>\n* built: <%= grunt.template.today("yyyy-mm-dd") %>\n*/\n'
      },
      build: {
        src: 'css/<%= pkg.name %>.css',
        dest: 'dist/<%= pkg.name %>.min.css'
      }
    },
    umd: {
      all: {
        options: {
          src: 'js/<%= pkg.name %>.js',
          dest: 'dist/<%= pkg.name %>.js',

          amdModuleId: 'createOpentokHardwareSetupComponent',
          globalAlias: 'createOpentokHardwareSetupComponent'

        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-umd');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-css');

  grunt.registerTask('default', ['umd', 'uglify', 'cssmin']);

};