import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import 'antd/dist/antd.css';
import { Layout, Card, Row, Col } from 'antd';
const { Header, Content } = Layout;

import { DynamicWidget, WidgetStateContext, socket } from 'haah/lib/webui/client';

const App = () => {
  const [widgetState, setWidgetState] = useState<Record<string, any>>({});

  useEffect(() => {
    socket.on('widget_state', (update) => {
      widgetState[update.id] = update;

      if (update.root) {
        setWidgetState({
          ...widgetState,
          [update.id]: update,
        });
      }
    });
  }, []);

  return (
    <Layout style={{ height: '100%' }}>
      <Header>Haah WebUI</Header>
      <Content>
        <WidgetStateContext.Provider value={widgetState}>
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
              .map((w) => (
                <DynamicWidget id={w.id} />
              ))}
          </Row>
        </WidgetStateContext.Provider>
      </Content>
    </Layout>
  );
};

ReactDOM.render(<App />, document.getElementById('app'));
