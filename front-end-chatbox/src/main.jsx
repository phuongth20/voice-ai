import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./store/store";
import App from "./App.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import "./index.css";
import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Building from "./pages/Building.jsx";
import Setting from "./pages/Setting.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import Cron from "./pages/Cron.jsx";
import Attribute from "./pages/Attribute.jsx";
import ScanPage from "./pages/Scan.jsx";
import SpeechToTextPage from "./pages/Speech.jsx";
import TranslatePage from "./pages/Translate.jsx";
import ChatPage from "./pages/Chat.jsx";
import RagPage from "./pages/Rag.jsx";
import IntentPage from "./pages/Intent.jsx";
import NerPage from "./pages/Ner.jsx";
import MetadataPage from "./pages/Metadata.jsx";

const BrowserRouter = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "crawl",
        children: [
          {
            path: "building",
            element: <Building />,
          },
          {
            path: "cron",
            element: <Cron />,
          },
          {
            path: "setting",
            element: (
              <PrivateRoute>
                <Setting />
              </PrivateRoute>
            ),
          },
          {
            path: "attribute",
            element: (
              <PrivateRoute>
                <Attribute />
              </PrivateRoute>
            ),
          },
        ]
      },
      

      // Nhánh OCR có các nhánh con
      {
        path: "ocr",
        children: [
          {
            path: "attribute",
            element: (
              <PrivateRoute>
                <Attribute />
              </PrivateRoute>
            ),
          },
          
          {
            path: "scan", 
            element: (
              <PrivateRoute>
                <ScanPage />
              </PrivateRoute>
            ),
          },
          
        ],
      },
      {
        path: "speech",
        children: [
          {
            path: "speech-to-text",
            element: (
              <PrivateRoute>
                <SpeechToTextPage />
              </PrivateRoute>
            ),
          },
          {
            path: "translate",
            element: (
              <PrivateRoute>
                <TranslatePage />
              </PrivateRoute>
            ),
          },
          
          
          
        ],
      },
      {
        path: "llm",
        children: [
          {
            path: "chat",
            element: (
              <PrivateRoute>
                <ChatPage />
              </PrivateRoute>
            ),
          },
          {
            path: "rag",
            element: (
              <PrivateRoute>
                <RagPage />
              </PrivateRoute>
            ),
          },
          
          
          
        ],
      },
      {
        path: "intent",
        children: [
          {
            path: "chat",
            element: (
              <PrivateRoute>
                <IntentPage />
              </PrivateRoute>
            ),
          }
        ],
      },      {
        path: "ner",
        children: [
          {
            path: "chat",
            element: (
              <PrivateRoute>
                <NerPage />
              </PrivateRoute>
            ),
          },
         

        ],
      },      {
        path: "metadata",
        children: [
          {
            path: "key",
            element: (
              <PrivateRoute>
                <MetadataPage />
              </PrivateRoute>
            ),
          },
         
          
          
          
        ],
      },
    ],
  },

  // Các đường dẫn khác như login và register
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={BrowserRouter}></RouterProvider>
    </Provider>
  </StrictMode>
);
