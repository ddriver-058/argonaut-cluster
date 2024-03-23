import { RouteRecordRaw } from 'vue-router';

import LoginPage from 'pages/LoginPage.vue';
import ArgonautClusterDashboard from 'pages/ArgonautClusterDashboard.vue';
import ClusterEditor from 'pages/ClusterEditor.vue';
import ActionConfirmation from 'pages/ActionConfirmation.vue';
import ProcessDrawer from 'pages/ProcessDrawer.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Dashboard with graph view and buttons
      {
        path: '', // default page
        components: {
          default: ArgonautClusterDashboard,
          processDrawer: ProcessDrawer
        },
        meta: { requiresAuth: true }
      },
      // Cluster Editor with live preview
      {
        path: '/login',
        component: LoginPage
      },
      {
        path: '/edit',
        component: ClusterEditor,
        meta: { requiresAuth: true } 
      },
      {
        path: '/actions/:action',
        components: {
          default: ArgonautClusterDashboard,
          dialog: ActionConfirmation
        },
        meta: { requiresAuth: true }
      }
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];



export default routes;
