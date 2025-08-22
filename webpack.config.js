const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
    clean: true,
    publicPath: '/',
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@styles': path.resolve(__dirname, 'src/styles'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/images/[name].[hash][ext]',
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/fonts/[name].[hash][ext]',
        },
      },
    ],
  },
  optimization: {
    minimize: process.env.NODE_ENV === 'production',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: process.env.NODE_ENV === 'production',
          },
          mangle: true,
        },
        extractComments: false,
      }),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
        // Custom chunk groups for better code splitting
        firebase: {
          test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
          name: 'firebase',
          chunks: 'all',
          priority: 20,
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
        router: {
          test: /[\\/]node_modules[\\/](react-router|react-router-dom)[\\/]/,
          name: 'router',
          chunks: 'all',
          priority: 15,
        },
        // Component chunks based on webpack chunk names
        quotaBanner: {
          test: /[\\/]src[\\/]components[\\/]QuotaStatusBanner/,
          name: 'quota-banner',
          chunks: 'all',
          priority: 10,
        },
        dashboardSection: {
          test: /[\\/]src[\\/]components[\\/]DashboardSection/,
          name: 'dashboard-section',
          chunks: 'all',
          priority: 10,
        },
        profileSection: {
          test: /[\\/]src[\\/]components[\\/]ProfileSection/,
          name: 'profile-section',
          chunks: 'all',
          priority: 10,
        },
        sidebar: {
          test: /[\\/]src[\\/]components[\\/]Sidebar/,
          name: 'sidebar',
          chunks: 'all',
          priority: 10,
        },
        topBar: {
          test: /[\\/]src[\\/]components[\\/]TopBar/,
          name: 'top-bar',
          chunks: 'all',
          priority: 10,
        },
        loadingOverlay: {
          test: /[\\/]src[\\/]components[\\/]LoadingOverlay/,
          name: 'loading-overlay',
          chunks: 'all',
          priority: 10,
        },
        notificationSystem: {
          test: /[\\/]src[\\/]components[\\/]NotificationSystem/,
          name: 'notification-system',
          chunks: 'all',
          priority: 10,
        },
        virtualScrolling: {
          test: /[\\/]src[\\/]components[\\/]VirtualScrollingList/,
          name: 'virtual-scrolling',
          chunks: 'all',
          priority: 10,
        },
        // Service chunks
        firestoreService: {
          test: /[\\/]src[\\/]services[\\/]firestoredb/,
          name: 'firestore-service',
          chunks: 'all',
          priority: 10,
        },
        facilityService: {
          test: /[\\/]src[\\/]services[\\/]facility-service/,
          name: 'facility-service',
          chunks: 'all',
          priority: 10,
        },
        dateUtils: {
          test: /[\\/]src[\\/]utils[\\/]dateUtils/,
          name: 'date-utils',
          chunks: 'all',
          priority: 10,
        },
      },
    },
    runtimeChunk: 'single',
    moduleIds: 'deterministic',
  },
  plugins: [
    // Compression for production builds
    ...(process.env.NODE_ENV === 'production' ? [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
      new CompressionPlugin({
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
    ] : []),
    // Bundle analyzer for development
    ...(process.env.ANALYZE === 'true' ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: false,
        reportFilename: 'bundle-report.html',
      }),
    ] : []),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    hot: true,
    historyApiFallback: true,
    client: {
      overlay: {
        errors: true,
        warnings: false,
      },
    },
  },
  performance: {
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [__filename],
    },
  },
};
