import React from "react";
import ReactDOM from "react-dom/client";
import { FluentProvider, webDarkTheme, webLightTheme } from "@fluentui/react-components";
import { App } from "./App";
import "./styles.css";

function Root() {
  const [dark, setDark] = React.useState(() => localStorage.getItem("atlascode.theme") === "dark");
  React.useEffect(() => {
    localStorage.setItem("atlascode.theme", dark ? "dark" : "light");
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  return <FluentProvider theme={dark ? webDarkTheme : webLightTheme}><App dark={dark} setDark={setDark} /></FluentProvider>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root /></React.StrictMode>);
