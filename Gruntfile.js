'use strict';

var mountFolder = function (connect, dir) {
	return connect.static(require('path').resolve(dir));
};

module.exports = function (grunt) {

	// Load grunt tasks
	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

	// App configuration, used throughout
	var appConfig = {
		src: 'src',
		test: 'test',
		tmp: '.tmp',
		dist: 'dist'
	};

	// TODO :: Read this from .bowerrc
	var bowerConfig = {
		directory: 'bower_components'
	};

	grunt.initConfig({
		app: appConfig,
		bower: bowerConfig,
		watch: {
			scripts: {
				files: ['<%= app.src %>/**/*.js'],
				tasks: ['concurrent:scripts']
			},
			sass: {
				files: ['<%= app.src %>/**/*.scss'],
				tasks: ['compass:dev']
			},
			tests: {
				files: ['<%= app.test %>/*.html', '<%= app.test %>/**/*.js'],
				tasks: ['concurrent:tests']
			},
			gruntfile: {
				files: ['Gruntfile.js'],
				tasks: ['jshint:gruntfile']
			}
		},
		concurrent: {
			scripts: ['jshint:scripts', 'mocha_phantomjs'],
			tests: ['jshint:tests', 'mocha_phantomjs']
		},
		connect: {
			options: {
				hostname: 'localhost'
			},
			dev: {
				options: {
					base: '<%= app.test %>',
					components: bowerConfig.directory,
					port: 8000,
					middleware: function (connect, options) {
						return [
							mountFolder(connect, '.tmp'),
							mountFolder(connect, 'bower_components'),
							mountFolder(connect, 'node_modules'),
							mountFolder(connect, options.base),
							mountFolder(connect, appConfig.src)
						];
					}
				}
			},
			dist: {
				options: {
					base: '<%= app.dist %>',
					port: 8000,
					keepalive: true,
					middleware: function (connect, options) {
						return [
							mountFolder(connect, options.base)
						];
					}
				}
			}
		},
		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			gruntfile: ['Gruntfile.js'],
			scripts: ['<%= app.src %>/**/*.js'],
			tests: ['<%= app.test %>/**/*.js']
		},
		compass: {
			dev: {
				options: {
					sassDir: '<%= app.src %>',
					cssDir: '<%= app.tmp %>',
					environment: 'development'
				}
			}
		},
		mocha_phantomjs: {
			all: {
				options: {
					urls: [
						'http://localhost:<%= connect.dev.options.port %>/index.html'
					]
				}
			}
		},
		requirejs: {
			dist: {
				options: {
					baseUrl: appConfig.src,
					optimize: 'none',
					name: 'LocationView',
					out: appConfig.dist + '/LocationView.js',
					useStrict: true,
					wrap: false,

					paths: {
						'mvc': '../bower_components/hazdev-webutils/src/mvc',
						'util': '../bower_components/hazdev-webutils/src/util',
						leaflet: '../node_modules/leaflet/dist/leaflet-src'
					},
					shim: {
						leaflet: {
							exports: 'L'
						}
					}
				}
			}
		},
		cssmin: {
			dist: {
				files: {
					'<%= app.dist %>/LocationView.min.css': [
						'node_modules/leaflet/dist/leaflet.css',
						'bower_components/hazdev-webutils/src/mvc/ModalView.css',
						'.tmp/LocationView.css'
					]
				}
			}
		},
		uglify: {
			options: {
				mangle: true,
				compress: true,
				report: 'gzip'
			},
			dist: {
				files: {
					'<%= app.dist %>/LocationView.min.js':
							['<%= app.dist %>/LocationView.js']
				}
			}
		},
		copy: {
			app: {
				expand: true,
				options: {mode: true},
				cwd: '<%= app.src %>',
				dest: '<%= app.dist %>',
				src: [
					'*.{png,gif,jpg,jpeg,cur}'
				]
			},
			css: {
				expand: true,
				options: {mode: true},
				cwd: '<%= app.tmp %>',
				dest: '<%= app.dist %>',
				src: [
					'LocationView.css'
				]
			},
			leaflet: {
				expand: true,
				options: {mode: true},
				cwd: 'node_modules/leaflet/dist/images',
				dest: '<%= app.dist %>/images',
				src: [
					'*.{png,gif,jpg,jpeg}'
				]
			},
			example: {
				expand: true,
				flatten: true,
				options: {
					mode: true,
					process: function (content) {
						content = content.replace(
								'<script src="/requirejs/require.js"></script>',
								'<script src="require.js"></script>');

						content = content.replace(
								'<script src="js/config.js"></script>',
								'');

						content = content.replace(
								'<script src="js/LocationViewUITest.js"></script>',
								'<script src="LocationViewUITest.js"></script>');

						content = content.replace(
								'<link rel="stylesheet" href="/leaflet/dist/leaflet.css"/>',
								'');

						content = content.replace(
								'<link rel="stylesheet" ' +
								'href="/hazdev-webutils/src/mvc/ModalView.css"/>',
								'');

						content = content.replace(
								'<link rel="stylesheet" href="/css/LocationViewUITest.css"/>',
								'<link rel="stylesheet" href="LocationView.min.css"/>');
						return content;
					}
				},
				cwd: '<%= app.test %>',
				dest: '<%= app.dist %>',
				src: [
					'LocationViewUITest.html',
					'js/LocationViewUITest.js'
				]
			},
			require: {
				expand: true,
				options: {mode: true},
				cwd: 'bower_components/requirejs',
				dest: '<%= app.dist %>',
				src: [
					'require.js'
				]
			}
		}
	});

	grunt.event.on('watch', function (action, filepath) {
		// Only lint the file that actually changed
		grunt.config(['jshint', 'scripts'], filepath);
	});

	grunt.registerTask('test', [
		'connect:dev',
		'mocha_phantomjs'
	]);

	grunt.registerTask('default', [
		'connect:dev',
		'compass:dev',
		'mocha_phantomjs',
		'watch'
	]);

	grunt.registerTask('build', [
		'jshint',
		'compass:dev',
		'cssmin:dist',
		'requirejs:dist',
		'uglify:dist',
		'copy:app',
		'copy:css',
		'copy:leaflet',
		'copy:example',
		'copy:require',
		'connect:dist'
	]);
};
