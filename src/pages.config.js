/**
 * pages.config.js - Page routing configuration
 *
 * Single source of truth for routing. Add a page by importing it and adding
 * an entry to PAGES with the desired route path as the key.
 *
 * THE ONLY SPECIAL VALUE: mainPage — controls which page renders at "/".
 */
import AppHub from './pages/AppHub';
import SplitView from './pages/SplitView';
import EndOfDayCalendar from './pages/EndOfDayCalendar';
import MasterKanbanDemo from './pages/MasterKanbanDemo';
import Settings from './pages/Settings';
import SettingsMasterKanban from './pages/SettingsMasterKanban';

export const PAGES = {
    "AppHub": AppHub,
    "splitview": SplitView,
    "end-of-day": EndOfDayCalendar,
    "settings/master-kanban-demo": MasterKanbanDemo,
    "settings": Settings,
    "settings/master-kanban": SettingsMasterKanban,
}

export const pagesConfig = {
    mainPage: "AppHub",
    Pages: PAGES,
};