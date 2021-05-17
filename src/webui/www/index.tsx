import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'

import 'antd/dist/antd.css';
import { Layout, Card, Row, Col } from 'antd';
const { Header, Content } = Layout;

import 'site_root';
import { widgets } from '../haah_frontend';

const App = () => {
    return (
        <Layout style={{height: '100%'}}>
            <Header>Haah WebUI</Header>
            <Content>
                <Row gutter={[16, 16]} style={{padding: 10, maxWidth: 1400, marginLeft: 'auto', marginRight: 'auto'}}>
                    {Object.entries(widgets).map(([k, Element]) => (
                        <Col key={k} xs={24} md={12} lg={8} xl={6}>
                            <Card title={k}>
                                <Element/>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Content>
        </Layout>
    )
}

ReactDOM.render(<App />, document.getElementById('app'))
