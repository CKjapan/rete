import React from "react";
import Rete from "rete";
import ReactRenderPlugin from "rete-react-render-plugin";
import ConnectionPlugin from "rete-connection-plugin";
import AreaPlugin from "rete-area-plugin";
import { MyNode } from "./MyNode";
import DockPlugin from 'rete-dock-plugin';
import CommentPlugin from 'rete-comment-plugin';
// import ContextMenuPlugin from 'rete-context-menu-plugin';

var numSocket = new Rete.Socket("Number value");

//インプット欄作成
class NumControl extends Rete.Control {
	static component = ({ value, onChange }) => (
		<input
			type="number"
			value={value}
			ref={ref => {
				ref && ref.addEventListener("pointerdown", e => e.stopPropagation());
			}}
			onChange={e => onChange(e.target.value)}
		/>
	);

	constructor(emitter, key, node, readonly = false) {
		super(key);
		this.emitter = emitter;
		this.key = key;
		this.component = NumControl.component;

		const initial = node.data[key] || 0;

		node.data[key] = initial;
		this.props = {
			readonly,
			value: initial,
			onChange: v => {
				this.setValue(v);
				this.emitter.trigger("process");
			}
		};
	}

	setValue(val) {
		this.props.value = val;
		this.putData(this.key, val);
		this.update();
	}
}



//　　出力BOX(左)作成
class NumComponent extends Rete.Component {
	constructor() {
		//タイトル
		super("出力BOX");
	}

	//タイトル以外を表示
	builder(node) {
		//output1ソケットを作成
		var out1 = new Rete.Output("num", "出力→", numSocket);
		//インプット欄を作成
		var ctrl = new NumControl(this.editor, "num", node);

		//タイトル意外を表示
		return node
			//インプット欄を表示
			.addControl(ctrl)
			//output1ソケットを表示
			.addOutput(out1);
	}

	worker(node, inputs, outputs) {
		outputs["num"] = node.data.num;
	}
}


//　　合計BOX(右)作成
class AddComponent extends Rete.Component {
	constructor() {
		//タイトル
		super("合計BOX");
		this.data.component = MyNode; // optional
	}

	builder(node) {
		//input1ソケットを作成
		var inp1 = new Rete.Input("num1", "→入力1", numSocket);
		//input2ソケット
		var inp2 = new Rete.Input("num2", "→入力2", numSocket);
		//output1ソケット
		var out = new Rete.Output("num", "出力→", numSocket);


		inp1.addControl(new NumControl(this.editor, "num1", node));
		inp2.addControl(new NumControl(this.editor, "num2", node));

		return node
			//入力１ソケット
			.addInput(inp1)
			//入力２ソケット
			.addInput(inp2)
			//合計欄
			.addControl(new NumControl(this.editor, "preview", node, true))
			//出力ソケット
			.addOutput(out);
	}

	worker(node, inputs, outputs) {
		var n1 = inputs["num1"].length ? inputs["num1"][0] : node.data.num1;
		var n2 = inputs["num2"].length ? inputs["num2"][0] : node.data.num2;
		var sum = Number(n1) + Number(n2);

		this.editor.nodes
			.find(n => n.id === node.id)
			.controls.get("preview")
			.setValue(sum);
		outputs["num"] = sum;
	}
}

//　　掛け算BOX(右)作成
class MultiComponent extends Rete.Component {
	constructor() {
		//タイトル
		super("掛け算BOX");
		this.data.component = MyNode; // optional
	}

	builder(node) {
		//input1ソケットを作成
		var inp1 = new Rete.Input("num1", "→入力1", numSocket);
		//input2ソケット
		var inp2 = new Rete.Input("num2", "→入力2", numSocket);
		//output1ソケット
		var out = new Rete.Output("num", "出力→", numSocket);

		inp1.addControl(new NumControl(this.editor, "num1", node));
		inp2.addControl(new NumControl(this.editor, "num2", node));

		return node
			//入力１ソケット
			.addInput(inp1)
			//入力２ソケット
			.addInput(inp2)
			//合計欄
			.addControl(new NumControl(this.editor, "preview", node, true))
			//出力ソケット
			.addOutput(out);
	}

	//計算式の設定
	worker(node, inputs, outputs) {
		var n1 = inputs["num1"].length ? inputs["num1"][0] : node.data.num1;
		var n2 = inputs["num2"].length ? inputs["num2"][0] : node.data.num2;
		var sum = Number(n1) * Number(n2);

		this.editor.nodes
			.find(n => n.id === node.id)
			.controls.get("preview")
			.setValue(sum);
		outputs["num"] = sum;
	}
}


//　　各BOX設定
export async function createEditor(container) {
	var components = [new NumComponent(), new AddComponent(), new MultiComponent()];

	//　プラグインの設定
	var editor = new Rete.NodeEditor("demo@0.1.0", container);
	editor.use(ConnectionPlugin);
	editor.use(ReactRenderPlugin);
	editor.use(DockPlugin, {
		container: document.querySelector('.dock'),
		itemClass: 'dock-item', // default: dock-item 
		plugins: [ReactRenderPlugin] // render plugins
	});
	editor.use(CommentPlugin, {
		margin: 10 // indent for new frame comments by default 30 (px)
	});

	var engine = new Rete.Engine("demo@0.1.0");

	components.map(c => {
		editor.register(c);
		engine.register(c);
	});

	//　初期配置の設定

	//作成したボックスを変数に代入
	var n1 = await components[0].createNode({ num: 2 });
	var n2 = await components[0].createNode({ num: 3 });
	// 追加１
	var n3 = await components[0].createNode({ num: 0 });
	var add = await components[1].createNode();
	// var multi = await components[2].createNode();

	//配置場所
	n1.position = [80, 200];
	n2.position = [80, 400];
	//追加２
	n3.position = [80, 600];
	add.position = [500, 240];
	// multi.position = [500, 540];

	//ブラウザに表示
	editor.addNode(n1);
	editor.addNode(n2);
	//追加３
	editor.addNode(n3);
	editor.addNode(add);
	// editor.addNode(multi);


	//　最初の線の繋がりの設定

	editor.connect(n1.outputs.get("num"), add.inputs.get("num1"));
	editor.connect(n2.outputs.get("num"), add.inputs.get("num2"));
	//追加４
	editor.connect(n3.outputs.get("num"), add.inputs.get("num3"));

	//keysownEvents
	editor.on(
		"keydown",
		async (e) => {
			if (e.code === "Backspace" || e.code === "Delete") {//deleteNode
				editor.selected.each(n => editor.removeNode(n));
			} else if (e.code === "KeyS") {//Json保存
				await engine.abort();
				await engine.process(editor.toJSON());
				const data = await editor.toJSON();
				localStorage.setItem('json', JSON.stringify(data));
				console.log(data);
			} else if (e.code === "KeyR") {//Json取得及び読み込み
				var json = localStorage.getItem('json');
				console.log(json);
				json = JSON.parse(json);
				console.log(json);
				await editor.fromJSON(json);
			}
		}
	);


	editor.view.resize();
	editor.trigger("process");
	AreaPlugin.zoomAt(editor, editor.nodes);

}






