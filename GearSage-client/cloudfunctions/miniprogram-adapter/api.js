/**
 * 小程序端 API 适配层：把原 REST 调用改成云函数调用
 */
export const callMiniApi = (action, payload = {}) =>
  wx.cloud.callFunction({
    name: 'miniApi',
    data: { action, payload }
  }).then(res => {
    const result = res.result || {};
    if (result.code !== 200) {
      throw new Error(result.msg || '请求失败');
    }
    return result.data;
  });

export const miniUserApi = {
  login: payload => callMiniApi('user.login', payload),
  info: id => callMiniApi('user.info', { id }),
  update: payload => callMiniApi('user.update', payload),
  points: () => callMiniApi('user.points')
};

export const miniTopicApi = {
  createDraft: payload => callMiniApi('topic.new', payload),
  publish: payload => callMiniApi('topic.update', payload),
  remove: id => callMiniApi('topic.delete', { id }),
  detail: topicId => callMiniApi('topic.get', { topicId }),
  list: payload => callMiniApi('topic.all', payload),
  mine: status => callMiniApi('topic.mine', { status }),
  toggleLike: topicId => callMiniApi('topic.like', { topicId })
};
