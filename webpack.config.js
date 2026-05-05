import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TerserPlugin from 'terser-webpack-plugin';

const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

export default {
	entry: path.join(__dirname, 'src/index.ts'),
	output: {
		path: path.join(__dirname, 'dist/'),
		filename: 'index.js',
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{
				test: /\.css$/,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.html$/,
				use: { loader: 'html-loader' },
			},
		],
	},
	optimization: {
		minimizer: [
			new TerserPlugin({
				extractComments: false,
				terserOptions: {
					format: {
						comments: false,
					},
				},
			}),
		],
	},
	experiments: {
		outputModule: true,
	},
	externalsType: 'module',
	externals: {
		// SillyTavern modules - resolved at runtime by the extension loader
		'world-info.js': '../../../../../scripts/world-info.js',
		'script.js': '../../../../../script.js',
		'extensions.js': '../../../../../scripts/extensions.js',
		'utils.js': '../../../../../scripts/utils.js',
	},
};
