// Must be the very first import — required by @react-navigation/stack for
// gesture/animation handling on native (Android/iOS). Missing this causes
// subtle touch/navigation glitches.
import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
