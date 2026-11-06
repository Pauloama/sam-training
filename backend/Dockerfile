FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["SamTraining.Core/SamTraining.Core.csproj", "SamTraining.Core/"]
COPY ["SamTraining.Infrastructure/SamTraining.Infrastructure.csproj", "SamTraining.Infrastructure/"]
COPY ["SamTraining.Api/SamTraining.Api.csproj", "SamTraining.Api/"]

RUN dotnet restore "SamTraining.Api/SamTraining.Api.csproj"

COPY . .
WORKDIR "/src/SamTraining.Api"
RUN dotnet build "SamTraining.Api.csproj" -c Release -o /app/build
RUN dotnet publish "SamTraining.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "SamTraining.Api.dll"]
