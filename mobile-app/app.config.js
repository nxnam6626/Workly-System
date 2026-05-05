const variant = process.env.APP_VARIANT || 'candidate';
const isRecruiter = variant === 'recruiter';

export default {
  expo: {
    name: isRecruiter ? "Workly Recruit" : "Workly",
    slug: isRecruiter ? "workly-recruit" : "workly-app",
    version: "1.0.0",
    scheme: "workly",
    orientation: "portrait",
    icon: isRecruiter ? "./assets/icon-recruiter.png" : "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0f172a"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: isRecruiter ? "com.workly.recruit" : "com.workly.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f172a"
      },
      package: isRecruiter ? "com.workly.recruit" : "com.workly.app"
    },
    web: {
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-web-browser"
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      variant: variant,
      eas: {
        projectId: "2763a8f8-abbf-4b91-9b40-d2c5ebe02d02"
      }
    }
  }
};
