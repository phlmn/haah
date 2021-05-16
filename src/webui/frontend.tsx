import { produceWithPatches } from 'immer';
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { io } from "socket.io-client";
import { parse } from '../persist_state';

import 'antd/dist/antd.css';
import { Layout, Card, Row, Col } from 'antd';
const { Header, Content } = Layout;

const App = () => {
    const [state, setState] = useState({} as Record<string, any>);
    const [widgets, setWidgets] = useState({} as Record<string, any>);
    const [lastFn, setLastFn] = useState(() => () => { });

    useEffect(() => {
        console.log("effect");

        const socket = io();
        (window as any).socket = socket;

        socket.on('disconnect', reason => console.log("disconnect", reason));
        socket.on('connect', () => console.log("connect"));

        socket.on('state', (slice) => {
            const parsedSlice = Object.fromEntries(Object.entries(slice).map(([k, v]) => [k, parse(v as string)]))
            setState((state) => ({ ...state, ...parsedSlice }));
            (window as any).state = state;
        });

        socket.on('widgets', (widgets) => {
            const parsedWidgets = Object.fromEntries(Object.entries(widgets).map(([k, v]) => {
                const value = v as { fn: string, stateSlice: string };
                const fn = function (props: any) {
                    const { state } = props;
                    const stateSlice = state[value.stateSlice];

                    // this function mimics the signature of the real upadateState function
                    const updateState = (stateSlice: any, producer: any) => {
                        const inner = () => {
                            const [newSlice, patches] = produceWithPatches(
                                stateSlice,
                                producer,
                            );
                            const patch = {
                                key: value.stateSlice,
                                oldSlice: stateSlice,
                                newSlice, patches,
                            };
                            console.log(patch);
                            socket.emit('patch', patch);

                            setState({ ...state, [value.stateSlice]: newSlice });
                        };
                        inner();
                        setLastFn(inner);
                    }
                    const haah_1 = { updateState };

                    return eval(value.fn)(stateSlice);
                }
                return [k, fn]
            }))
            setWidgets(parsedWidgets);
            (window as any).widgets = parsedWidgets;
        });

        socket.on("patch_outdated", () => {
            lastFn()
        });
    }, ["no_deps"]);

    return (
        <Layout style={{height: '100%'}}>
            <Header>Haah WebUI</Header>
            <Content>
                <Row gutter={[16, 16]} style={{padding: 10, maxWidth: 1400, margin: 'auto'}}>
                    {Object.entries(widgets).map(([k, Element]) => (
                        <Col key={k} xs={24} md={12} lg={8} xl={6}>
                            <Card title={k}>
                                <Element state={state} />
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Content>
        </Layout>
    )
}

ReactDOM.render(<App />, document.getElementById('app'))
