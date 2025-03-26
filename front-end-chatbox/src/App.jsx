import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ScanOutlined,
  CameraOutlined,
  FileTextOutlined,
  MutedOutlined,
  SoundOutlined,
  TranslationOutlined,
  RobotOutlined,
  WechatOutlined,
  FileDoneOutlined,
  QuestionCircleOutlined 
} from "@ant-design/icons";
import { Button, Layout, Menu, Dropdown, theme } from "antd";
import { Outlet, Link } from "react-router-dom";
import { logout } from "./store/userSlice";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AiFillOpenAI } from "react-icons/ai";
import { FaSpider } from "react-icons/fa6";
import { FaSearchPlus } from "react-icons/fa";
import { FaMicrophone } from "react-icons/fa6";
import { GiOwl,GiParrotHead } from "react-icons/gi";

const { Header, Sider, Content } = Layout;
const { SubMenu } = Menu;

const App = () => {
  const currentUser = useSelector((state) => state.user.access_token);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState("1"); // Default key
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
    navigate(e.key); // Điều hướng dựa trên key của Menu
  };

  const userLogout = () => {
    dispatch(logout());
    //reload page after logout
    window.location.reload();
  };

  // Dropdown menu items for login and register
  const userMenu = (
    <Menu
      items={[
        {
          key: "1",
          label: <Link to="/login">Login</Link>,
        },
        {
          key: "2",
          label: <Link to="/register">Register</Link>,
        },
      ]}
    />
  );

  const loggedUserMenu = (
    <Menu
      items={[
        {
          key: "1",
          label: <Link to="/profile">Profile</Link>,
        },
        {
          key: "2",
          label: (
            <div
              onClick={() => {
                userLogout();
              }}
            >
              Logout
            </div>
          ),
        },
      ]}
    />
  );

  return (
    <div>
      <Layout style={{ height: "100%" }}>
        <Sider trigger={null} collapsible collapsed={collapsed}>
          <div className="titleTNB">
            <div className="demo-logo-vertical" />
            <div className="flex items-center justify-center p-2 text-5xl cursor-pointer">
              <AiFillOpenAI  />
              {!collapsed && (
                <span className="ml-2 text-3xl font-bold">FARM AI</span>
              )}
            </div>
          </div>
          <div className="menu" >
            <Menu 
              theme="light"
              mode="inline"
              selectedKeys={[selectedKey]} // Bind the selected key
              onClick={handleMenuClick} // Handle menu click
            >
              <SubMenu className="icon-menu" key="crawl" icon={<FaSpider />} title="Search Engine">
                <Menu.Item className="title-menu" key="/crawl/building" icon={<HomeOutlined />}>
                  <Link to="/crawl/building">Building</Link>
                </Menu.Item>
                <Menu.Item key="/crawl/cron" icon={<ClockCircleOutlined />}>
                  <Link to="/crawl/cron">Cron Jobs</Link>
                </Menu.Item>
                <Menu.Item key="/crawl/setting" icon={<SettingOutlined />}>
                  <Link to="/crawl/setting">Setting</Link>
                </Menu.Item>
                <Menu.Item key="/crawl/attribute" icon={<AppstoreOutlined />}>
                  <Link to="/crawl/attribute">Attribute</Link>
                </Menu.Item>
              </SubMenu>
              <SubMenu key="ocr" icon={<GiOwl  />} title="OCR Service">
                <Menu.Item key="/ocr/attribute" icon={<AppstoreOutlined />}>
                  <Link to="/ocr/attribute">Attribute</Link>
                </Menu.Item>

                <Menu.Item key="/ocr/scan" icon={<ScanOutlined />}>
                  <Link to="/ocr/scan">Scan</Link>
                </Menu.Item>
              </SubMenu>
              <SubMenu key="speech" icon={<GiParrotHead  />} title="Voice Service">
                <Menu.Item
                  key="/speech/speech-to-text"
                  icon={<MutedOutlined />}
                >
                  <Link to="/speech/speech-to-text">Speech-to-text</Link>
                </Menu.Item>
                <Menu.Item
                  key="/speech/translate"
                  icon={<TranslationOutlined />}
                >
                  <Link to="/speech/translate">Translate</Link>
                </Menu.Item>
              </SubMenu>
              <SubMenu key="llm" icon={<RobotOutlined  />} title="LLM Service">
                <Menu.Item
                    key="/llm/chat"
                    icon={<  WechatOutlined />}
                  >
                    <Link to="/llm/chat">Chat</Link>
                </Menu.Item>
                <Menu.Item
                    key="/llm/rag"
                    icon={<FileDoneOutlined />}
                  >
                    <Link to="/llm/rag">Rag</Link>
                </Menu.Item>
              </SubMenu>
              <SubMenu key="intent" icon={<QuestionCircleOutlined />} title="Intent Service">
                <Menu.Item
                    key="/intent/chat"
                    icon={<MutedOutlined />}
                  >
                    <Link to="/intent/chat">Intent</Link>
                </Menu.Item>
              </SubMenu>
              <SubMenu key="ner" icon={<RobotOutlined  />} title="NER Service">
                <Menu.Item
                    key="/ner/chat"
                    icon={<WechatOutlined />}
                  >
                    <Link to="/ner/chat">NER</Link>
                </Menu.Item>
              </SubMenu> <SubMenu key="metadata" icon={<CameraOutlined  />} title="Metadata Service">
                <Menu.Item
                    key="/metadata/key"
                    icon={<MutedOutlined />}
                  >
                    <Link to="/metadata/key">Metadata</Link>
                </Menu.Item>
              </SubMenu>
            </Menu>
          </div>
        </Sider>

        <Layout>
          <Header
            style={{
              padding: 0,
              background: colorBgContainer,
              height: "48px",
              width: "full",
            }}
          >
            <div className="flex items-center justify-between">
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: 48,
                  height: 48,
                }}
              />
              {currentUser ? (
                <Dropdown overlay={loggedUserMenu} trigger={["click"]}>
                  <Button
                    type="text"
                    icon={<UserOutlined />}
                    style={{
                      fontSize: "16px",
                      width: 48,
                      height: 48,
                    }}
                  />
                </Dropdown>
              ) : (
                <Dropdown overlay={userMenu} trigger={["click"]}>
                  <Button
                    type="text"
                    icon={<UserOutlined />}
                    style={{
                      fontSize: "16px",
                      width: 64,
                      height: 64,
                    }}
                  />
                </Dropdown>
              )}
            </div>
          </Header>

          <Content
            style={{
              margin: "24px 16px",
              padding: 15,
              minHeight: "auto",
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
              height: "auto",
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default App;
