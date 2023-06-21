import axios from 'axios';
import { Candidate } from '../model/Candidate';

const BASE_URL = `https://graph.microsoft.com/v1.0/users/info@smoothstack.com/sendMail`;

export const sendLicenseAssignmentNotification = async (
  authToken: string,
  candidate: Candidate,
  newUserEmail: string
): Promise<void> => {
  const { FirstName, LastName } = candidate;
  const message = {
    message: {
      subject: `Action Required: MS License Assignment for new Engaged Candidate: ${FirstName} ${LastName}`,
      body: {
        contentType: 'HTML',
        content: `Greetings,<br/><br/>${FirstName} ${LastName} has been added to Cut/Keep and has been assigned an unlicensed Smoothstack email address. Please verify the information below is correct, and then login to the Microsoft Admin Portal (https://admin.microsoft.com) to assign an <strong>Office 365 F3</strong> License to the user.<br/><br/>Candidate Name: ${FirstName} ${LastName}<br/>New User Account Email: ${newUserEmail}<br/><br/>If the information above is not correct, please correct it in the MS Admin Portal, as well as Salesforce, <p style="text-decoration: underline;display:inline;"><strong>prior</strong></p>&nbsp;to assigning the license.`,
      },
      toRecipients: [
        {
          emailAddress: {
            address: 'hr@smoothstack.com',
          },
        },
      ],
    },
  };
  await axios.post(`${BASE_URL}`, message, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

export const sendNewAccountDetails = async (
  authToken: string,
  externalEmail: string,
  accountEmail: string,
  password: string
): Promise<void> => {
  const message = {
    message: {
      subject: 'Action Required: Login to your New Microsoft 365 Account for Smoothstack',
      body: {
        contentType: 'HTML',
        content: `<div align="center" style="font-family: 'Segoe UI', Arial, sans-serif">
          <table
            align="center"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            border="0"
            style="max-width: 704px; background-color: #ffffff; word-break: break-word"
          >
            <tbody>
              <tr>
                <td height="20">&nbsp;</td>
                <td height="20">&nbsp;</td>
                <td height="20">&nbsp;</td>
              </tr>
              <tr>
                <td align="center" valign="top" width="100%" style="padding-top: 32px">
                  <table
                    name="logo"
                    align="center"
                    width="91%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    style="padding-right: 64px"
                  >
                    <tbody>
                      <tr>
                        <td>
                          <img
                            align="left"
                            width="100"
                            height="21"
                            alt="Microsoft"
                            src="https://ci6.googleusercontent.com/proxy/8YDHQmdDjSkvjgtpVDrxo8EH3MKqBQMJnDYW-tqSLE7vNYYTwxuNcQAqLKTSJ0X4FViQPBtv3qLnv0vcylrY=s0-d-e1-ft#https://prod.msocdn.com/images/microsoft.png"
                            border="0"
                            class="CToWUd"
                          />
                        </td>
                        <td style="text-align: right; float: right"></td>
                      </tr>
                      <tr>
                        <td height="15">&nbsp;</td>
                      </tr>
                    </tbody>
                  </table>
                  <table
                    name="content"
                    width="91%"
                    cellpadding="0"
                    cellspacing="0"
                    border="0"
                    bgcolor="ffffff"
                    style="font-size: 16px"
                  >
                    <tbody>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 14px">
                            <tbody>
                              <tr>
                                <td width="100%" style="font-size: 28px">
                                  <strong> Sign In to your New Account </strong>
                                </td>
                              </tr>
                              <tr>
                                <td width="100%" height="32">&nbsp;</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table>
                            <tbody>
                              <tr>
                                <td style="display: inline; padding-right: 15px">
                                  <img
                                    width="59"
                                    height="59"
                                    src="https://ci3.googleusercontent.com/proxy/cuS6nNg3PTtSapxI0q0ZFGd35DjIK_4ZUQZpaWHcoTqc4smUS8TcNrOZUJ2ztInz9twMBg2jHWfw9P4hE--45gGoSxjtOBpa5nc=s0-d-e1-ft#https://prod.msocdn.com/images/M365WordBrandIcon_48.png"
                                    class="CToWUd"
                                  />
                                </td>
                                <td style="display: inline; padding-right: 15px">
                                  <img
                                    width="59"
                                    height="59"
                                    src="https://ci6.googleusercontent.com/proxy/yv9IsBk7nznM9pWf2tI5OlcTN18Sj-_krtxKF6QC8C6QNXXPyViluYqG2p1EAYmMcQR9ohP_es1df1ZtjuQYJXKWUtZqZLSevFht=s0-d-e1-ft#https://prod.msocdn.com/images/M365ExcelBrandIcon_48.png"
                                    class="CToWUd"
                                  />
                                </td>
                                <td style="display: inline; padding-right: 15px">
                                  <img
                                    width="59"
                                    height="59"
                                    src="https://ci4.googleusercontent.com/proxy/eJKAMZ9MOIZ-sSOAwCI3HGStCc-o8RMkKvuRIBCE_E8Tpqi2ue0KY8oEIwWJ3EAuSklU3PeQHdblmcrHeHb0mljjT5acL7nQX_Ty1e4LuPE=s0-d-e1-ft#https://prod.msocdn.com/images/M365PowerPointBrandIcon_48.png"
                                    class="CToWUd"
                                  />
                                </td>
                                <td style="display: inline; padding-right: 15px">
                                  <img
                                    width="59"
                                    height="59"
                                    src="https://ci4.googleusercontent.com/proxy/jeTgZYQ6OVEQRp4bZ0BuKJrHneDDyYuQi9ovrBqMd7zA6Ri1_n2zlgfINFMUgMTUmc_DoXiWZvq_hpSN3HULnQeIaAEP63xsLw70qKc=s0-d-e1-ft#https://prod.msocdn.com/images/M365OutlookBrandIcon_48.png"
                                    class="CToWUd"
                                  />
                                </td>
                                <td style="display: inline; padding-right: 15px">
                                  <img
                                    width="59"
                                    height="59"
                                    src="https://ci3.googleusercontent.com/proxy/U0mqNbtWq93b-BGKAzHHAMqC-lK9zyMoEyY1dIRl6NsnKUfN9pheXRanDlsqTwfOhpUa52kTXN43w9BjaDtWu0Q5b7JB6xHoyreo=s0-d-e1-ft#https://prod.msocdn.com/images/M365TeamsBrandIcon_48.png"
                                    class="CToWUd"
                                  />
                                </td>
                                <td style="display: inline; padding-right: 15px">
                                  <img
                                    width="59"
                                    height="59"
                                    src="https://ci3.googleusercontent.com/proxy/5eb-0S7lUMh_FDNLS_f4Uh4TY85U93z1D6gu1Nbz6BYcORTMm6j6-BlyMBEt5_1AZvTTORZAKHO9vMz7kE5xsoQZiEd9KfftIdthLlK6=s0-d-e1-ft#https://prod.msocdn.com/images/M365OneDriveBrandIcon_48.png"
                                    class="CToWUd"
                                  />
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td width="100%" height="32">&nbsp;</td>
                      </tr>
                      <tr>
                        <td>
                          <table width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tbody>
                              <tr>
                                <td>
                                  <b>Username:</b> ${accountEmail}
                                  <br />
        
                                  <b>Password:</b> ${password}
                                </td>
                              </tr>
                              <tr>
                                <td width="100%" height="20">&nbsp;</td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td width="100%" height="20" style="font-size: 14px; padding-top: 6px">
                          <div>
                            An administrator at Smoothstack has created a new Microsoft account for you to use with Office.
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="100%" height="20">&nbsp;</td>
                      </tr>
                      <tr>
                        <td width="100%" height="20" style="font-size: 14px; padding-top: 6px">
                          <div style="float: left; padding-top: 6px">
                            Your new account includes the latest version of Office apps like Word, Excel, and PowerPoint, chat,
                            meetings, and file sharing with Microsoft Teams; and free cloud storage on OneDrive, so you
                            can share files and see changes as people make them, from any device.
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="100%" height="20">&nbsp;</td>
                      </tr>
                      <tr>
                        <td width="100%" height="20" style="font-size: 14px; padding-top: 6px">
                          <div style="float: left; padding-top: 6px">
                            To get started, sign in with the username and password at the top of this email, and download the
                            latest Office apps to your desktop.
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="100%" height="36">&nbsp;</td>
                      </tr>
                      <tr>
                        <td>
                          <table cellspacing="0" cellpadding="0" border="0">
                            <tbody>
                              <tr>
                                <td
                                  bgcolor="#d83b01"
                                  style="
                                    width: 160px;
                                    border-color: #d83b01;
                                    text-align: center;
                                    padding: 6px 16px;
                                    border-radius: 2px;
                                  "
                                >
                                  <a
                                    style="color: #ffffff; text-decoration: none; display: block"
                                    href="https://Office.com"
                                    target="_blank"
                                  >
                                    <strong style="text-decoration: none; color: #ffffff; font-weight: normal"
                                      >Sign in to Office <span class="il">365</span></strong
                                    >
                                  </a>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
          <br /><br />
          <table
            name="footer"
            align="center"
            width="91%"
            border="0"
            style="
              font-size: 11px;
              color: #333333;
              letter-spacing: 0;
              line-height: 13px;
              background-color: #f3f2f1;
              margin-left: 32px;
              margin-right: 32px;
              margin-bottom: 32px;
              padding: 24px;
            "
          >
            <tbody>
              <tr>
                <td style="font-size: 13px; line-height: 16px">
                  <table border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: none">
                    <tbody>
                      <tr style="height: 17.95pt">
                        <td width="92" style="width: 115px; background: white; padding: 0in 5.4pt 0in 5.4pt; height: 32px">
                          <div class="MsoNormal" style="line-height: 12pt; text-align: center">
                            <span style="font-size: 10pt; color: black">
                              <a
                                style="color: #252424; font-size: 14px"
                                href="https://go.microsoft.com/fwlink/?LinkID=2161738"
                                target="_blank"
                              >
                                <strong>Get the app</strong>
                              </a>
                            </span>
                          </div>
                        </td>
                        <td width="36" style="width: auto; padding: 0in 5pt 0in 5.4pt; height: 17.95pt">
                          <div class="MsoNormal" style="line-height: 12pt">
                            <span style="font-size: 10pt; color: #333333">
                              <img
                                border="0"
                                width="20"
                                height="20"
                                style="width: 0.2583in; height: 0.2583in"
                                id="m_-6280889222439861591m_6164871674066782132_x0000_i1028"
                                src="https://ci6.googleusercontent.com/proxy/sqK8XBSx1-See7ng3dz42C3taOS6e0v5HKqo1-3D3HBaFxLhp-Uxt-VT0UTxcT9crqAdbmVi3SasISo7wg=s0-d-e1-ft#https://prod.msocdn.com/images/iOSLogo.png"
                                class="CToWUd"
                              />
                            </span>
                          </div>
                        </td>
                        <td width="36" style="width: auto; padding: 0in 5pt 0in 5.4pt; height: 17.95pt">
                          <div class="MsoNormal" style="line-height: 12pt">
                            <span style="font-size: 10pt; color: #333333">
                              <img
                                border="0"
                                width="20"
                                height="20"
                                style="width: 0.2583in; height: 0.2583in"
                                id="m_-6280889222439861591m_6164871674066782132_x0000_i1028"
                                src="https://ci6.googleusercontent.com/proxy/F7rz-ndUZnZZotUZgycC3Eq9lSsqjeF8Kd9_5P_o7zIQaENGdGW0Yn1lYZx2mngq6Bytpy1MV5W-uhyguvFM9ww=s0-d-e1-ft#https://prod.msocdn.com/images/AndroidLogo.png"
                                class="CToWUd"
                              />
                            </span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <p style="color: #696969">
                    Copyright 2022, Microsoft Corporation
                    <br />
                    <a
                      style="text-decoration: underline; color: #696969"
                      href="https://go.microsoft.com/fwlink/?LinkId=521839"
                      target="_blank"
                      >Privacy Statement</a
                    >
                    <br />
                    <br />
                    Microsoft Corporation, One Microsoft Way, Redmond, WA 98052 USA
                    <br />
                    <br />
                    <img
                      width="100"
                      alt="Microsoft"
                      src="https://ci6.googleusercontent.com/proxy/8YDHQmdDjSkvjgtpVDrxo8EH3MKqBQMJnDYW-tqSLE7vNYYTwxuNcQAqLKTSJ0X4FViQPBtv3qLnv0vcylrY=s0-d-e1-ft#https://prod.msocdn.com/images/microsoft.png"
                      border="0"
                      class="CToWUd"
                    />
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        `,
      },
      toRecipients: [
        {
          emailAddress: {
            address: externalEmail,
          },
        },
      ],
    },
  };
  await axios.post(`${BASE_URL}`, message, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};
