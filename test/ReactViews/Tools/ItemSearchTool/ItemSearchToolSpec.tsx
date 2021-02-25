import "../../../SpecMain";
import React from "react";
import {
  act,
  create,
  ReactTestInstance,
  ReactTestRenderer
} from "react-test-renderer";
import { assertObject } from "../../../../lib/Core/Json";
import CommonStrata from "../../../../lib/Models/CommonStrata";
import ItemSearchProvider, {
  ItemSearchParameter,
  ItemSearchResult
} from "../../../../lib/Models/ItemSearchProvider";
import { registerItemSearchProvider } from "../../../../lib/Models/ItemSearchProviders";
import Terria from "../../../../lib/Models/Terria";
import ViewState from "../../../../lib/ReactViewModels/ViewState";
import ErrorComponent from "../../../../lib/ReactViews/Tools/ItemSearchTool/ErrorComponent";
import ItemSearchTool, {
  PropsType
} from "../../../../lib/ReactViews/Tools/ItemSearchTool/ItemSearchTool";
import Loading from "../../../../lib/ReactViews/Tools/ItemSearchTool/Loading";
import SearchForm from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchForm";
import SearchResults from "../../../../lib/ReactViews/Tools/ItemSearchTool/SearchResults";
import { withThemeContext } from "../../withThemeContext";
import MockSearchableItem from "./MockSearchableItem";
import i18next from "i18next";

class TestItemSearchProvider extends ItemSearchProvider {
  async initialize(): Promise<void> {
    return;
  }

  async describeParameters(): Promise<ItemSearchParameter[]> {
    return [
      {
        type: "numeric",
        id: "height",
        name: "Height",
        range: { min: 1, max: 200 }
      }
    ];
  }

  async search(): Promise<ItemSearchResult[]> {
    return [];
  }
}

describe("ItemSearchTool", function() {
  let viewState: ViewState;
  let item: MockSearchableItem;
  let itemSearchProvider: ItemSearchProvider;
  let rendered: ReactTestRenderer;

  beforeEach(function() {
    registerItemSearchProvider("testProvider", TestItemSearchProvider);
    const terria: Terria = new Terria();
    viewState = new ViewState({
      terria,
      catalogSearchProvider: null,
      locationSearchProviders: []
    });
    item = new MockSearchableItem("test", terria);
    item.setTrait(CommonStrata.user, "search", {
      providerType: "testProvider",
      providerOptions: {},
      resultTemplate: undefined,
      highlightColor: undefined,
      parameters: []
    });
    const provider = item.createItemSearchProvider();
    assertObject(provider);
    itemSearchProvider = provider;
  });

  it("can be rendered", function() {
    act(() => {
      rendered = render({ item, itemSearchProvider, viewState });
    });
    const component = rendered.root.findByType(ItemSearchTool);
    expect(component).toBeDefined();
  });

  it("initializes an describes the parameters when mounted", async function() {
    spyOn(itemSearchProvider, "initialize").and.callThrough();
    spyOn(itemSearchProvider, "describeParameters").and.callThrough();
    await act(() => {
      rendered = render({
        item,
        itemSearchProvider,
        viewState
      });
    });
    expect(itemSearchProvider.initialize).toHaveBeenCalledTimes(1);
    expect(itemSearchProvider.describeParameters).toHaveBeenCalledTimes(1);
  });

  describe("loading", function() {
    it("shows a Loading component while loading", function() {
      act(() => {
        rendered = render({
          item,
          itemSearchProvider,
          viewState
        });
      });
      const progressText = rendered.root.findByType(Loading);
      expect(progressText).toBeDefined();
      expect(progressText.props.children).toEqual(
        i18next.t("itemSearchTool.loading")
      );
    });

    it("shows an error message on load error", async function() {
      spyOn(itemSearchProvider, "describeParameters").and.callFake(() =>
        Promise.reject(new Error(`Something happened`))
      );

      rendered = await renderAndLoad({
        item,
        itemSearchProvider,
        viewState
      });

      const error = rendered.root.findByType(ErrorComponent);
      expect(error).toBeDefined();
      expect(error.props.children).toEqual(
        i18next.t("itemSearchTool.loadError")
      );
    });

    it("shows a search from on successful load", async function() {
      spyOn(itemSearchProvider, "describeParameters").and.callFake(() =>
        Promise.resolve([
          {
            type: "numeric",
            id: "height",
            name: "Height",
            range: { min: 1, max: 180 }
          }
        ])
      );
      rendered = await renderAndLoad({
        item,
        itemSearchProvider,
        viewState
      });
      const searchForm = rendered.root.findByType(SearchForm);
      expect(searchForm).toBeDefined();
    });

    it("it shows the search results", async function() {
      spyOn(itemSearchProvider, "search").and.callFake(() =>
        Promise.resolve([])
      );

      const { root } = await renderAndLoad({
        item,
        itemSearchProvider,
        viewState
      });
      await submitForm(root);
      const searchResults = root.findByType(SearchResults);
      expect(searchResults).toBeDefined();
    });
  });
});

function render(props: Omit<PropsType, "i18n" | "t" | "tReady">) {
  return create(withThemeContext(<ItemSearchTool {...props} />));
}

function renderAndLoad(
  props: Omit<PropsType, "i18n" | "t" | "tReady">
): Promise<ReactTestRenderer> {
  return new Promise(resolve => {
    act(() => {
      const rendered = render({
        ...props,
        afterLoad: () => resolve(rendered)
      });
    });
  });
}

async function submitForm(root: ReactTestInstance): Promise<ReactTestInstance> {
  const searchForm = root.findByType("form");
  expect(searchForm).toBeDefined();
  await act(() => searchForm.props.onSubmit({ preventDefault: () => {} }));
  return searchForm;
}
