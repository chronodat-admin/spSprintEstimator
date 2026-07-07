declare interface IEstimatrWebPartStrings {
  PropertyPaneDescription: string;
  LayoutGroupName: string;
  HideLeftNavLabel: string;
  HidePageBarLabel: string;
  HideTopBarLabel: string;
  HideChromeOn: string;
  HideChromeOff: string;
  AppLocalEnvironmentSharePoint: string;
  AppLocalEnvironmentTeams: string;
  AppLocalEnvironmentOffice: string;
  AppLocalEnvironmentOutlook: string;
  AppSharePointEnvironment: string;
  AppTeamsTabEnvironment: string;
  AppOfficeEnvironment: string;
  AppOutlookEnvironment: string;
  UnknownEnvironment: string;
}

declare module 'EstimatrWebPartStrings' {
  const strings: IEstimatrWebPartStrings;
  export = strings;
}
