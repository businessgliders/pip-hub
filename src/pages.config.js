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
import Inbox from './pages/Inbox';
import Contacts from './pages/Contacts';
import PublicForm from './pages/PublicForm';

export const PAGES = {
    "AppHub": AppHub,
    "splitview": SplitView,
    "end-of-day": EndOfDayCalendar,
    "inbox": Inbox,
    "contacts": Contacts,
    "form": PublicForm,
}

export const pagesConfig = {
    mainPage: "AppHub",
    Pages: PAGES,
};