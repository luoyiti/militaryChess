# 本地离线字体

沿用原项目的 Noto Serif SC、LXGW WenKai、Special Elite、Stardos Stencil 和 Oswald。完整原字体位于项目自己的 `scripts/.cache/e/fonts/`，生成的字体和 CSS 位于 `public/fonts/`。

需要 Python 3 和 `requirements.txt` 的依赖。可使用已有 Python，或创建本地环境：

```sh
python3 -m venv scripts/.cache/e/fonts/venv
scripts/.cache/e/fonts/venv/bin/python -m pip install -r scripts/fonts/requirements.txt
PY=scripts/.cache/e/fonts/venv/bin/python bash scripts/fonts/run.sh --force
PYTHONPATH=scripts/.cache/e/fonts/python scripts/.cache/e/fonts/venv/bin/python scripts/fonts/verify.py
```

`run.sh` 使用 `PY` 指定的解释器，默认 `python3`，没有机器专属路径。已存在的完整字体直接复用；缺失时按原项目的下载来源补齐。生成器扫描 `src` 下的源码/JSON、所有 `config` JSON，以及首页、照片、音乐、credits 文本。修改可见文本后重新运行，字符集未变时会跳过。

`verify.py` 读回 8 个 WOFF2 的字符映射，检查页面全部汉字、ASCII 和原字体的版权/许可记录，成功时写入 `public/fonts/coverage.json`。字形扫描回归测试：`python3 scripts/fonts/test_subset.py`。

原始 Noto Serif SC 没有的少数拉丁扩展字通过生成的 `unicode-range` 规则，使用现有 LXGW WenKai 补齐，字体族名保持一致；读回检查也验证这些规则实际引用的字体和字形。

许可沿用原项目的 `LICENSES.md` 和 `public/credits.json`：Noto Serif SC、LXGW WenKai、Stardos Stencil、Oswald 为 SIL OFL 1.1；Special Elite 为 Apache 2.0。生成时保留字体自身的版权和许可字段。
