import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';

// Must match tabBarStyle.bottom in App.js
const TAB_BAR_FLOAT_OFFSET = 25;
const EXTRA_SPACE = 20;

// The tab bar floats over screen content (position: 'absolute'), so lists need
// this much bottom padding for their last item to scroll clear of it.
export default function useTabBarSpace() {
  return useBottomTabBarHeight() + TAB_BAR_FLOAT_OFFSET + EXTRA_SPACE;
}
