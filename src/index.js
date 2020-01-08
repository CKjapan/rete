import React from "react";
import ReactDOM from "react-dom";
import { createEditor } from "./rete";

import "./styles.css";

//経費Box表示
function App() {
	return (
		<div className="App">
			<div
				style={{ width: "100vw", height: "100vh" }}
				ref={ref => ref && createEditor(ref)}
			/>
		</div>
	);
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
