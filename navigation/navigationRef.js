import { createNavigationContainerRef } from '@react-navigation/native';

// Lets components outside the navigators (like the mini player overlay) navigate.
export const navigationRef = createNavigationContainerRef();
