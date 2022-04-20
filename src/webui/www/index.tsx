import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import 'antd/dist/antd.css';
import { Layout, Card, Row, Col } from 'antd';
const { Header, Content } = Layout;

import { io } from 'socket.io-client';

const App = () => {
  const [widgetState, setWidgetState] = useState<Record<string, any>>({});

  useEffect(() => {
    const socket = io();

    socket.on('widget_state', (update) => {
      widgetState[update.id] = update;

      if (update.root) {
        setWidgetState({
          ...widgetState,
          [update.id]: update,
        });
      }
    });

    socket.on('disconnect', (reason) => console.log('disconnect', reason));
    socket.on('connect', () => console.log('connect'));
  }, []);

  return (
    <Layout style={{ height: '100%' }}>
      <Header>Haah WebUI</Header>
      <Content>
        <Row
          gutter={[16, 16]}
          style={{
            padding: 10,
            maxWidth: 1400,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {Object.values(widgetState)
            .filter((w) => w.root)
            .sort((a, b) => a.order - b.order)
            .map((w) => <Widget state={w} />)}
        </Row>
      </Content>
    </Layout>
  );
};

function Widget({ state }: { state: any }) {
  return (
    <Col xs={24} md={12} lg={8} xl={6}>
      {JSON.stringify(state)}
      {/* <Card title={k}> */}
        {/* <Element /> */}
      {/* </Card> */}
    </Col>
  );
}
ReactDOM.render(<App />, document.getElementById('app'));
