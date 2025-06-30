import { Flex } from "antd";

import NameListForm from "./components/NameListForm/NameListForm";

import "./App.css";

const App = () => {
  return (
    <Flex gap="middle" align="start" vertical>
      <Flex className="App-titleStyle" justify="center" align="center">
        <h1>NE OPS BUS TRACKER</h1>
      </Flex>
      <Flex className="App-FlexBoxStyle" justify="center" >
        <NameListForm />
      </Flex>
    </Flex>
  );
};

export default App;
